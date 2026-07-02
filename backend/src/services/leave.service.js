const repo = require('../repositories/leave.repository');
const attendanceRepo = require('../repositories/attendance.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles, notifyUser } = require('./notification.service');
const payrollService = require('./payroll.service');

function countDaysInclusive(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

async function listLeaveRequests(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getLeaveRequest(id) {
  const lr = await repo.findById(id);
  if (!lr) throw ApiError.notFound('Leave request not found');
  return lr;
}

async function createLeaveRequest(data) {
  if (new Date(data.endDate) < new Date(data.startDate)) {
    throw ApiError.badRequest('endDate cannot be before startDate');
  }
  const totalDays = countDaysInclusive(data.startDate, data.endDate);
  const overlaps = await repo.findOverlappingRequests(data.employeeId, data.startDate, data.endDate);
  if (overlaps.length) {
    throw ApiError.conflict('Leave request overlaps with an existing pending or approved leave');
  }
  const lr = await repo.create({ ...data, totalDays });

  // Notify managers of new leave request
  await notifyRoles({
    roles: ['OWNER', 'MANAGER'],
    title: 'New Leave Request',
    message: `A new leave request has been submitted for ${lr.start_date} to ${lr.end_date} (${totalDays} day${totalDays !== 1 ? 's' : ''}).`,
    severity: 'INFO',
    module: 'leave',
    referenceType: 'leave_requests',
    referenceId: lr.id,
  }).catch(() => {});

  return lr;
}

/**
 * Approving a leave request must, in the same transaction:
 *  1. Mark the leave_requests row APPROVED
 *  2. Create/update an `attendance` row with status ON_LEAVE for every day
 *     in the leave range (this is the "Leave Approval -> Updates Attendance"
 *     link from the workflow spec; payroll generation reads attendance,
 *     so this also transitively keeps payroll correct).
 */
async function approveLeaveRequest(id, approverId) {
  const existing = await getLeaveRequest(id);
  if (existing.status !== 'PENDING') {
    throw ApiError.conflict(`Leave request is already ${existing.status.toLowerCase()}`);
  }

  const overlaps = await repo.findOverlappingRequests(existing.employee_id, existing.start_date, existing.end_date, existing.id);
  if (overlaps.length) {
    throw ApiError.conflict('Leave request overlaps with an existing pending or approved leave');
  }

  const result = await withTransaction(async (client) => {
    const updated = await repo.updateStatus(id, 'APPROVED', approverId, null, client);
    const dates = await repo.getDateRange(existing.start_date, existing.end_date);
    const previousAttendanceRows = await Promise.all(
      dates.map((date) => attendanceRepo.findByEmployeeAndDate(existing.employee_id, date, client))
    );

    for (const date of dates) {
      const previousRow = previousAttendanceRows.find((row) => row && row.attendance_date === date) || null;
      const leaveSnapshot = previousRow
        ? {
            status: previousRow.status,
            checkIn: previousRow.check_in,
            checkOut: previousRow.check_out,
            shiftName: previousRow.shift_name,
            hoursWorked: previousRow.hours_worked,
            overtimeHours: previousRow.overtime_hours,
            remarks: previousRow.remarks,
          }
        : null;

      await attendanceRepo.upsert(
        {
          employeeId: existing.employee_id,
          attendanceDate: date,
          status: 'ON_LEAVE',
          leaveRequestId: updated.id,
          leaveSnapshot,
        },
        approverId,
        client
      );
    }

    await payrollService.recalculatePayrollForPeriods(
      payrollService.collectAffectedPeriods(existing.start_date, existing.end_date),
      approverId,
      client
    );

    return updated;
  });

  await notifyRoles({
    roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    title: 'Leave Approved',
    message: `Leave request for ${existing.employee_name} (${existing.start_date} to ${existing.end_date}) was approved.`,
    severity: 'INFO',
    module: 'leave',
    referenceType: 'leave_requests',
    referenceId: id,
  }).catch(() => {});

  return result;
}

async function rejectLeaveRequest(id, approverId, rejectionReason) {
  const existing = await getLeaveRequest(id);
  if (existing.status !== 'PENDING') {
    throw ApiError.conflict(`Leave request is already ${existing.status.toLowerCase()}`);
  }
  const result = await repo.updateStatus(id, 'REJECTED', approverId, rejectionReason);

  // Notify the employee if they have a linked user account
  if (existing.user_id) {
    await notifyUser({
      userId: existing.user_id,
      title: 'Leave Request Rejected',
      message: `Your leave request (${existing.start_date} to ${existing.end_date}) was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      severity: 'WARNING',
      module: 'leave',
      referenceType: 'leave_requests',
      referenceId: id,
    }).catch(() => {});
  }

  return result;
}

async function cancelLeaveRequest(id) {
  const existing = await getLeaveRequest(id);
  if (!['PENDING', 'APPROVED'].includes(existing.status)) {
    throw ApiError.conflict('Only pending or approved leave requests can be cancelled');
  }

  return withTransaction(async (client) => {
    if (existing.status === 'APPROVED') {
      const attendanceRows = await attendanceRepo.findByLeaveRequestId(id, client);
      for (const row of attendanceRows) {
        if (row.leave_snapshot) {
          await attendanceRepo.upsert(
            {
              employeeId: row.employee_id,
              attendanceDate: row.attendance_date,
              status: row.leave_snapshot.status,
              checkIn: row.leave_snapshot.checkIn,
              checkOut: row.leave_snapshot.checkOut,
              shiftName: row.leave_snapshot.shiftName,
              hoursWorked: row.leave_snapshot.hoursWorked,
              overtimeHours: row.leave_snapshot.overtimeHours,
              remarks: row.leave_snapshot.remarks,
            },
            row.marked_by,
            client
          );
        } else {
          await attendanceRepo.remove(row.id, client);
        }
      }

      await payrollService.recalculatePayrollForPeriods(
        payrollService.collectAffectedPeriods(existing.start_date, existing.end_date),
        existing.approved_by || null,
        client
      );
    }

    return repo.cancel(id, client);
  });
}

module.exports = {
  listLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
};
