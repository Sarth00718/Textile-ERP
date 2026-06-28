const { query } = require('../config/db');

async function create(data, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO quality_inspections (fabric_roll_id, inspected_by, result, defect_type, defect_points, grade, remarks)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.fabricRollId, data.inspectedBy || null, data.result, data.defectType || null, data.defectPoints || 0, data.grade || null, data.remarks || null]
  );
  return rows[0];
}

async function list({ result, fabricRollId, limit, offset }) {
  const conditions = [];
  const params = [];
  if (result) {
    params.push(result);
    conditions.push(`qi.result = $${params.length}`);
  }
  if (fabricRollId) {
    params.push(fabricRollId);
    conditions.push(`qi.fabric_roll_id = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM quality_inspections qi ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT qi.*, fr.roll_no, e.full_name AS inspector_name
     FROM quality_inspections qi
     JOIN fabric_rolls fr ON fr.id = qi.fabric_roll_id
     LEFT JOIN employees e ON e.id = qi.inspected_by
     ${whereClause} ORDER BY qi.inspection_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT qi.*, fr.roll_no FROM quality_inspections qi JOIN fabric_rolls fr ON fr.id = qi.fabric_roll_id WHERE qi.id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { create, list, findById };
