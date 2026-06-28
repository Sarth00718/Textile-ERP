const { query } = require('../config/db');

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO waste_records (waste_date, waste_type, source_machine_id, production_order_id, quantity_kg, disposal_method, recovery_value, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.wasteDate || new Date().toISOString().slice(0, 10), data.wasteType, data.sourceMachineId || null,
      data.productionOrderId || null, data.quantityKg, data.disposalMethod || null, data.recoveryValue || 0,
      data.notes || null, userId,
    ]
  );
  return rows[0];
}

async function list({ wasteType, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (wasteType) {
    params.push(wasteType);
    conditions.push(`wr.waste_type = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`wr.waste_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`wr.waste_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM waste_records wr ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT wr.*, m.name AS machine_name, po.production_order_no FROM waste_records wr
    LEFT JOIN machines m ON m.id = wr.source_machine_id
    LEFT JOIN production_orders po ON po.id = wr.production_order_id
    ${whereClause} ORDER BY wr.waste_date DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

module.exports = { create, list };
