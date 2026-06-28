const { query } = require('../config/db');

async function list({ limit, offset }) {
  const countRes = await query('SELECT COUNT(*) FROM production_plans');
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await query(
    `SELECT pp.*, fd.name AS fabric_design_name, fd.design_code
     FROM production_plans pp JOIN fabric_designs fd ON fd.id = pp.fabric_design_id
     ORDER BY pp.start_date DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT pp.*, fd.name AS fabric_design_name, fd.design_code
     FROM production_plans pp JOIN fabric_designs fd ON fd.id = pp.fabric_design_id WHERE pp.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM production_plans WHERE plan_code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO production_plans (plan_code, fabric_design_id, planned_quantity_meters, start_date, end_date, priority, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.planCode, data.fabricDesignId, data.plannedQuantityMeters, data.startDate, data.endDate, data.priority || 'NORMAL', data.notes || null, userId]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const params = [];
  const map = {
    plannedQuantityMeters: 'planned_quantity_meters', startDate: 'start_date', endDate: 'end_date',
    priority: 'priority', notes: 'notes',
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
  const { rows } = await query(`UPDATE production_plans SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM production_plans WHERE id = $1', [id]);
}

module.exports = { list, findById, findByCode, create, update, remove };
