const { query } = require('../config/db');

async function upsert(data) {
  const efficiency = data.hoursWorked > 0
    ? Math.round(((data.quantityProducedMeters || 0) / data.hoursWorked) * 100) / 100
    : 0;
  const { rows } = await query(
    `INSERT INTO worker_productivity (employee_id, production_date, machine_id, quantity_produced_meters, hours_worked, efficiency_percent, defect_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (employee_id, production_date, machine_id)
     DO UPDATE SET quantity_produced_meters = EXCLUDED.quantity_produced_meters, hours_worked = EXCLUDED.hours_worked,
       efficiency_percent = EXCLUDED.efficiency_percent, defect_count = EXCLUDED.defect_count
     RETURNING *`,
    [data.employeeId, data.productionDate, data.machineId || null, data.quantityProducedMeters || 0, data.hoursWorked || 0, efficiency, data.defectCount || 0]
  );
  return rows[0];
}

async function list({ employeeId, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (employeeId) {
    params.push(employeeId);
    conditions.push(`wp.employee_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`wp.production_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`wp.production_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM worker_productivity wp ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT wp.*, e.full_name AS employee_name, e.employee_code, m.name AS machine_name
    FROM worker_productivity wp
    JOIN employees e ON e.id = wp.employee_id
    LEFT JOIN machines m ON m.id = wp.machine_id
    ${whereClause} ORDER BY wp.production_date DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

module.exports = { upsert, list };
