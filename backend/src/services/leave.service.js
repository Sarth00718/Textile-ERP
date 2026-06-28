const repo = require('../repositories/leave.repository');
const attendanceRepo = require('../repositories/attendance.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

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
  return repo.create({ ...data, totalDays });
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

  const result = await withTransaction(async (client) => {
    const updated = await repo.updateStatus(id, 'APPROVED', approverId, null, client);
    const dates = await repo.getDateRange(existing.start_date, existing.end_date);
    for (const date of dates) {
      await attendanceRepo.upsert(
        { employeeId: existing.employee_id, attendanceDate: date, status: 'ON_LEAVE' },
        approverId,
        client
      );
    }
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
  return repo.updateStatus(id, 'REJECTED', approverId, rejectionReason);
}

async function cancelLeaveRequest(id) {
  const existing = await getLeaveRequest(id);
  if (existing.status !== 'PENDING') {
    throw ApiError.conflict('Only pending leave requests can be cancelled');
  }
  return repo.cancel(id);
}

module.exports = {
  listLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
};
