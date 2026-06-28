const { query } = require('../config/db');

async function create(data, userId, client = null) {
  const executor = client || { query };
  const item = await executor.query('SELECT current_stock FROM inventory_items WHERE id = $1 FOR UPDATE', [data.inventoryItemId]);
  if (!item.rows.length) throw new Error('Inventory item not found');

  const currentStock = Number(item.rows[0].current_stock);
  let newStock;
  if (data.txnType === 'IN' || data.txnType === 'RETURN') {
    newStock = currentStock + Number(data.quantity);
  } else if (data.txnType === 'OUT') {
    newStock = currentStock - Number(data.quantity);
  } else if (data.txnType === 'ADJUSTMENT') {
    newStock = Number(data.quantity); // quantity represents the absolute new value for adjustments
  } else {
    newStock = currentStock; // TRANSFER: net-zero at the item level in this simplified single-warehouse model
  }

  await executor.query('UPDATE inventory_items SET current_stock = $1, updated_at = NOW() WHERE id = $2', [newStock, data.inventoryItemId]);

  const { rows } = await executor.query(
    `INSERT INTO inventory_transactions (inventory_item_id, txn_type, quantity, balance_after, unit_cost, reference_type, reference_id, notes, performed_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.inventoryItemId, data.txnType, data.quantity, newStock, data.unitCost || null,
      data.referenceType || null, data.referenceId || null, data.notes || null, userId,
    ]
  );
  return rows[0];
}

async function list({ inventoryItemId, txnType, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (inventoryItemId) {
    params.push(inventoryItemId);
    conditions.push(`it.inventory_item_id = $${params.length}`);
  }
  if (txnType) {
    params.push(txnType);
    conditions.push(`it.txn_type = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`it.created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`it.created_at <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM inventory_transactions it ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT it.*, ii.name AS item_name, ii.item_code, ii.unit
     FROM inventory_transactions it JOIN inventory_items ii ON ii.id = it.inventory_item_id
     ${whereClause} ORDER BY it.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

module.exports = { create, list };
