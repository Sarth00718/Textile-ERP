const { query } = require('../config/db');
const { safeSortColumn, safeSortDirection } = require('../utils/queryHelpers');

const SORTABLE = ['start_date', 'created_at', 'status'];

async function list({ employeeId, status, leaveType, sortBy, sortDir, limit, offset }) {
  const conditions = [];
  const params = [];

  if (employeeId) {
    params.push(employeeId);
    conditions.push(`l.employee_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  }
  if (leaveType) {
    params.push(leaveType);
    conditions.push(`l.leave_type = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = safeSortColumn(sortBy, SORTABLE, 'created_at');
  const sortDirection = safeSortDirection(sortDir);

  const countRes = await query(`SELECT COUNT(*) FROM leave_requests l ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT l.*, e.full_name AS employee_name, e.employee_code
     FROM leave_requests l
     JOIN employees e ON e.id = l.employee_id
     ${whereClause}
     ORDER BY l.${sortCol} ${sortDirection}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT l.*, e.full_name AS employee_name, e.employee_code FROM leave_requests l
     JOIN employees e ON e.id = l.employee_id WHERE l.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status)
     VALUES ($1,$2,$3,$4,$5,$6,'PENDING') RETURNING *`,
    [data.employeeId, data.leaveType, data.startDate, data.endDate, data.totalDays, data.reason || null]
  );
  return rows[0];
}

async function updateStatus(id, status, approvedBy, rejectionReason, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE leave_requests SET status = $1, approved_by = $2, approved_at = NOW(), rejection_reason = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [status, approvedBy, rejectionReason || null, id]
  );
  return rows[0];
}

async function cancel(id) {
  const { rows } = await query(
    `UPDATE leave_requests SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}

async function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().slice(0, 10));
  }
  return dates;
}

module.exports = { list, findById, create, updateStatus, cancel, getDateRange };
