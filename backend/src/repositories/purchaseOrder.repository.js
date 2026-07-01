const { query } = require('../config/db');

async function list({ search, status, supplierId, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`po.po_number ILIKE $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`po.status = $${params.length}`);
  }
  if (supplierId) {
    params.push(supplierId);
    conditions.push(`po.supplier_id = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM purchase_orders po ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT po.*, s.name AS supplier_name, s.supplier_code
     FROM purchase_orders po JOIN suppliers s ON s.id = po.supplier_id
     ${whereClause} ORDER BY po.order_date DESC`;

  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }

  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT po.*, s.name AS supplier_name, s.supplier_code FROM purchase_orders po
     JOIN suppliers s ON s.id = po.supplier_id WHERE po.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByNumber(poNumber) {
  const { rows } = await query('SELECT * FROM purchase_orders WHERE po_number = $1', [poNumber]);
  return rows[0] || null;
}

async function findItemsByPO(poId) {
  const { rows } = await query(
    `SELECT poi.*, ii.name AS item_name, ii.unit FROM purchase_order_items poi
     JOIN inventory_items ii ON ii.id = poi.inventory_item_id WHERE poi.purchase_order_id = $1`,
    [poId]
  );
  return rows;
}

async function findItemById(id) {
  const { rows } = await query('SELECT * FROM purchase_order_items WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create(data, subtotal, totalAmount, userId, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, status, subtotal, tax_amount, total_amount, notes, created_by)
     VALUES ($1,$2,$3,$4,'DRAFT',$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.poNumber, data.supplierId, data.orderDate || new Date().toISOString().slice(0, 10),
      data.expectedDeliveryDate || null, subtotal, data.taxAmount || 0, totalAmount, data.notes || null, userId,
    ]
  );
  return rows[0];
}

async function createItem(poId, item, client) {
  const executor = client || { query };
  const lineTotal = item.quantityOrdered * item.unitPrice;
  const { rows } = await executor.query(
    `INSERT INTO purchase_order_items (purchase_order_id, inventory_item_id, quantity_ordered, unit_price, line_total)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [poId, item.inventoryItemId, item.quantityOrdered, item.unitPrice, lineTotal]
  );
  return rows[0];
}

async function updateStatus(id, status, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

async function incrementItemReceived(itemId, quantity, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE purchase_order_items SET quantity_received = quantity_received + $1 WHERE id = $2 RETURNING *`,
    [quantity, itemId]
  );
  return rows[0];
}

module.exports = {
  list, findById, findByNumber, findItemsByPO, findItemById,
  create, createItem, updateStatus, incrementItemReceived,
};
