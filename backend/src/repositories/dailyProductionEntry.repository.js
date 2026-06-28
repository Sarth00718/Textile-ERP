const { query } = require('../config/db');

async function list({ productionOrderId, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (productionOrderId) {
    params.push(productionOrderId);
    conditions.push(`dpe.production_order_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`dpe.entry_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`dpe.entry_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM daily_production_entries dpe ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT dpe.*, po.production_order_no, m.name AS machine_name, m.machine_code, e.full_name AS operator_name
     FROM daily_production_entries dpe
     JOIN production_orders po ON po.id = dpe.production_order_id
     JOIN machines m ON m.id = dpe.machine_id
     LEFT JOIN employees e ON e.id = dpe.operator_id
     ${whereClause} ORDER BY dpe.entry_date DESC, dpe.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT dpe.*, po.production_order_no FROM daily_production_entries dpe
     JOIN production_orders po ON po.id = dpe.production_order_id WHERE dpe.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data, userId, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO daily_production_entries (production_order_id, machine_id, entry_date, shift_name,
       operator_id, quantity_produced_meters, quantity_rejected_meters, yarn_consumed_kg,
       machine_runtime_minutes, remarks, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      data.productionOrderId, data.machineId, data.entryDate || new Date().toISOString().slice(0, 10),
      data.shiftName || 'DAY', data.operatorId || null, data.quantityProducedMeters,
      data.quantityRejectedMeters || 0, data.yarnConsumedKg || 0, data.machineRuntimeMinutes || 0,
      data.remarks || null, userId,
    ]
  );
  return rows[0];
}

async function getTotalsForProductionOrder(productionOrderId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(quantity_produced_meters),0) AS total_produced,
            COALESCE(SUM(quantity_rejected_meters),0) AS total_rejected,
            COALESCE(SUM(yarn_consumed_kg),0) AS total_yarn_consumed
     FROM daily_production_entries WHERE production_order_id = $1`,
    [productionOrderId]
  );
  return rows[0];
}

module.exports = { list, findById, create, getTotalsForProductionOrder };
