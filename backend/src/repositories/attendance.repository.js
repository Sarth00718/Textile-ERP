const { query } = require('../config/db');
const { safeSortColumn, safeSortDirection } = require('../utils/queryHelpers');

const SORTABLE = ['attendance_date', 'created_at'];

async function list({ employeeId, departmentId, status, startDate, endDate, sortBy, sortDir, limit, offset }) {
  const conditions = [];
  const params = [];

  if (employeeId) {
    params.push(employeeId);
    conditions.push(`a.employee_id = $${params.length}`);
  }
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`e.department_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`a.attendance_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`a.attendance_date <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = safeSortColumn(sortBy, SORTABLE, 'attendance_date');
  const sortDirection = safeSortDirection(sortDir);

  const countRes = await query(
    `SELECT COUNT(*) FROM attendance a JOIN employees e ON e.id = a.employee_id ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT a.*, e.full_name AS employee_name, e.employee_code, e.department_id
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    ${whereClause}
    ORDER BY a.${sortCol} ${sortDirection}, e.full_name ASC`;

  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }

  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT a.*, e.full_name AS employee_name, e.employee_code FROM attendance a
     JOIN employees e ON e.id = a.employee_id WHERE a.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByEmployeeAndDate(employeeId, date) {
  const { rows } = await query('SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2', [employeeId, date]);
  return rows[0] || null;
}

async function upsert(data, userId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out, shift_name, hours_worked, overtime_hours, remarks, marked_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (employee_id, attendance_date)
     DO UPDATE SET status = EXCLUDED.status, check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out,
       shift_name = EXCLUDED.shift_name, hours_worked = EXCLUDED.hours_worked, overtime_hours = EXCLUDED.overtime_hours,
       remarks = EXCLUDED.remarks, marked_by = EXCLUDED.marked_by, updated_at = NOW()
     RETURNING *`,
    [
      data.employeeId,
      data.attendanceDate,
      data.status,
      data.checkIn || null,
      data.checkOut || null,
      data.shiftName || null,
      data.hoursWorked || 0,
      data.overtimeHours || 0,
      data.remarks || null,
      userId,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const params = [];
  const map = {
    status: 'status',
    checkIn: 'check_in',
    checkOut: 'check_out',
    shiftName: 'shift_name',
    hoursWorked: 'hours_worked',
    overtimeHours: 'overtime_hours',
    remarks: 'remarks',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE attendance SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM attendance WHERE id = $1', [id]);
}

async function getSummaryForPeriod(employeeId, startDate, endDate) {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'PRESENT') AS days_present,
       COUNT(*) FILTER (WHERE status = 'ABSENT') AS days_absent,
       COUNT(*) FILTER (WHERE status = 'ON_LEAVE') AS days_on_leave,
       COUNT(*) FILTER (WHERE status = 'HALF_DAY') AS half_days,
       COALESCE(SUM(overtime_hours), 0) AS total_overtime_hours
     FROM attendance
     WHERE employee_id = $1 AND attendance_date BETWEEN $2 AND $3`,
    [employeeId, startDate, endDate]
  );
  return rows[0];
}

module.exports = { list, findById, findByEmployeeAndDate, upsert, update, remove, getSummaryForPeriod };
