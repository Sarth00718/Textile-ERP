const { query } = require('../config/db');

async function list({ productionOrderId, inventoryItemId, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (productionOrderId) {
    params.push(productionOrderId);
    conditions.push(`rmc.production_order_id = $${params.length}`);
  }
  if (inventoryItemId) {
    params.push(inventoryItemId);
    conditions.push(`rmc.inventory_item_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`rmc.consumption_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`rmc.consumption_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM raw_material_consumptions rmc ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT rmc.*, ii.name AS item_name, ii.unit, po.production_order_no
     FROM raw_material_consumptions rmc
     JOIN inventory_items ii ON ii.id = rmc.inventory_item_id
     JOIN production_orders po ON po.id = rmc.production_order_id
     ${whereClause} ORDER BY rmc.consumption_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

module.exports = { list };
