const { query } = require('../config/db');

async function nextRollNumber() {
  const { rows } = await query(
    `SELECT 'ROLL-' || LPAD((COALESCE(MAX(SUBSTRING(roll_no FROM 6)::INT), 0) + 1)::TEXT, 6, '0') AS next_no
     FROM fabric_rolls WHERE roll_no ~ '^ROLL-[0-9]+$'`
  );
  return rows[0].next_no;
}

async function create(data, client) {
  const executor = client || { query };
  const rollNo = await nextRollNumber();
  const { rows } = await executor.query(
    `INSERT INTO fabric_rolls (roll_no, production_order_id, daily_production_entry_id, fabric_design_id,
       length_meters, weight_kg, status, warehouse_location)
     VALUES ($1,$2,$3,$4,$5,$6,'PRODUCED',$7) RETURNING *`,
    [
      rollNo, data.productionOrderId, data.dailyProductionEntryId || null, data.fabricDesignId,
      data.lengthMeters, data.weightKg || null, data.warehouseLocation || null,
    ]
  );
  return rows[0];
}

async function list({ status, search, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`fr.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`fr.roll_no ILIKE $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM fabric_rolls fr ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT fr.*, fd.name AS fabric_design_name, po.production_order_no
     FROM fabric_rolls fr
     JOIN fabric_designs fd ON fd.id = fr.fabric_design_id
     JOIN production_orders po ON po.id = fr.production_order_id
     ${whereClause} ORDER BY fr.produced_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT fr.*, fd.name AS fabric_design_name, po.production_order_no
     FROM fabric_rolls fr
     JOIN fabric_designs fd ON fd.id = fr.fabric_design_id
     JOIN production_orders po ON po.id = fr.production_order_id
     WHERE fr.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function setStatus(id, status, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE fabric_rolls SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

module.exports = { create, list, findById, setStatus, nextRollNumber };
