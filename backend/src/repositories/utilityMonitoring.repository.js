const { query } = require('../config/db');

// ---- Electricity ----
async function createElectricityReading(data, userId) {
  const settingsRes = await query('SELECT electricity_rate_per_unit FROM factory_settings LIMIT 1');
  const rate = settingsRes.rows[0] ? Number(settingsRes.rows[0].electricity_rate_per_unit) : 8;
  const cost = data.unitsConsumed * rate;
  const { rows } = await query(
    `INSERT INTO electricity_readings (reading_date, department_id, machine_id, meter_reading, units_consumed, cost_amount, recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.readingDate, data.departmentId || null, data.machineId || null, data.meterReading, data.unitsConsumed, cost, userId]
  );
  return rows[0];
}

async function listElectricityReadings({ departmentId, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`er.department_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`er.reading_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`er.reading_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM electricity_readings er ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT er.*, d.name AS department_name, m.name AS machine_name FROM electricity_readings er
    LEFT JOIN departments d ON d.id = er.department_id
    LEFT JOIN machines m ON m.id = er.machine_id
    ${whereClause} ORDER BY er.reading_date DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

// ---- Water ----
async function createWaterReading(data, userId) {
  const settingsRes = await query('SELECT water_rate_per_unit FROM factory_settings LIMIT 1');
  const rate = settingsRes.rows[0] ? Number(settingsRes.rows[0].water_rate_per_unit) : 0.05;
  const cost = data.unitsConsumed * rate;
  const { rows } = await query(
    `INSERT INTO water_readings (reading_date, department_id, meter_reading, units_consumed, cost_amount, recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.readingDate, data.departmentId || null, data.meterReading, data.unitsConsumed, cost, userId]
  );
  return rows[0];
}

async function listWaterReadings({ departmentId, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`wr.department_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`wr.reading_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`wr.reading_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM water_readings wr ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT wr.*, d.name AS department_name FROM water_readings wr
    LEFT JOIN departments d ON d.id = wr.department_id
    ${whereClause} ORDER BY wr.reading_date DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

module.exports = { createElectricityReading, listElectricityReadings, createWaterReading, listWaterReadings };
