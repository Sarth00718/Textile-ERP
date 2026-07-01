const { query } = require('../config/db');

function getExecutor(client) {
  return client || { query };
}

async function findRunByPeriod(month, year, client = null) {
  const executor = getExecutor(client);
  const { rows } = await executor.query('SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2', [month, year]);
  return rows[0] || null;
}

async function findRunById(id, client = null) {
  const executor = getExecutor(client);
  const { rows } = await executor.query('SELECT * FROM payroll_runs WHERE id = $1', [id]);
  return rows[0] || null;
}

async function listRuns({ status, periodMonth, periodYear, limit, offset }, client = null) {
  const executor = getExecutor(client);
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (periodMonth) {
    params.push(periodMonth);
    conditions.push(`period_month = $${params.length}`);
  }
  if (periodYear) {
    params.push(periodYear);
    conditions.push(`period_year = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await executor.query(`SELECT COUNT(*) FROM payroll_runs ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM payroll_runs ${whereClause} ORDER BY period_year DESC, period_month DESC`;
  if (limit === undefined) {
    const { rows } = await executor.query(baseQuery, params);
    return { rows, total };
  }

  params.push(limit, offset);
  const { rows } = await executor.query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function createRun(month, year, userId, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO payroll_runs (period_month, period_year, status, generated_by, generated_at)
     VALUES ($1, $2, 'DRAFT', $3, NOW()) RETURNING *`,
    [month, year, userId]
  );
  return rows[0];
}

async function setRunStatus(id, status, totalAmount, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE payroll_runs SET status = $1, total_amount = $2,
       paid_at = CASE WHEN $1 = 'PAID' THEN NOW() ELSE paid_at END, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, totalAmount, id]
  );
  return rows[0];
}

async function listActiveEmployeesWithRange(client = null) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `SELECT * FROM employees WHERE employment_status = 'ACTIVE'`
  );
  return rows;
}

async function insertItem(item, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO payroll_items (
      payroll_run_id, employee_id, days_present, days_absent, days_on_leave, paid_leave_days,
      overtime_hours, base_salary, overtime_amount, production_bonus, deductions, net_salary, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'DRAFT')
    ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
      days_present = EXCLUDED.days_present, days_absent = EXCLUDED.days_absent,
      days_on_leave = EXCLUDED.days_on_leave, paid_leave_days = EXCLUDED.paid_leave_days,
      overtime_hours = EXCLUDED.overtime_hours, base_salary = EXCLUDED.base_salary,
      overtime_amount = EXCLUDED.overtime_amount, production_bonus = EXCLUDED.production_bonus,
      deductions = EXCLUDED.deductions, net_salary = EXCLUDED.net_salary, updated_at = NOW()
    RETURNING *`,
    [
      item.payrollRunId, item.employeeId, item.daysPresent, item.daysAbsent, item.daysOnLeave,
      item.paidLeaveDays, item.overtimeHours, item.baseSalary, item.overtimeAmount,
      item.productionBonus, item.deductions, item.netSalary,
    ]
  );
  return rows[0];
}

async function listItemsByRun(runId, client = null) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `SELECT pi.*, e.full_name AS employee_name, e.employee_code, e.department_id, d.name AS department_name
     FROM payroll_items pi
     JOIN employees e ON e.id = pi.employee_id
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE pi.payroll_run_id = $1
     ORDER BY e.full_name`,
    [runId]
  );
  return rows;
}

async function markItemsPaid(runId, client) {
  const executor = getExecutor(client);
  await executor.query(`UPDATE payroll_items SET status = 'PAID', paid_at = NOW() WHERE payroll_run_id = $1`, [runId]);
}

module.exports = {
  findRunByPeriod,
  findRunById,
  listRuns,
  createRun,
  setRunStatus,
  listActiveEmployeesWithRange,
  insertItem,
  listItemsByRun,
  markItemsPaid,
};
