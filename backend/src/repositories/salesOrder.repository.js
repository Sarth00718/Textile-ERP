const { query } = require('../config/db');

async function list({ search, status, customerId, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`so.so_number ILIKE $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`so.status = $${params.length}`);
  }
  if (customerId) {
    params.push(customerId);
    conditions.push(`so.customer_id = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM sales_orders so ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT so.*, c.name AS customer_name, c.customer_code
     FROM sales_orders so JOIN customers c ON c.id = so.customer_id
     ${whereClause} ORDER BY so.order_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT so.*, c.name AS customer_name, c.customer_code FROM sales_orders so
     JOIN customers c ON c.id = so.customer_id WHERE so.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByNumber(soNumber) {
  const { rows } = await query('SELECT * FROM sales_orders WHERE so_number = $1', [soNumber]);
  return rows[0] || null;
}

async function findItemsBySO(soId) {
  const { rows } = await query(
    `SELECT soi.*, fd.name AS fabric_design_name, fd.design_code FROM sales_order_items soi
     JOIN fabric_designs fd ON fd.id = soi.fabric_design_id WHERE soi.sales_order_id = $1`,
    [soId]
  );
  return rows;
}

async function findItemById(id) {
  const { rows } = await query('SELECT * FROM sales_order_items WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create(data, subtotal, totalAmount, userId, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO sales_orders (so_number, customer_id, order_date, required_by_date, status, subtotal, tax_amount, total_amount, notes, created_by)
     VALUES ($1,$2,$3,$4,'DRAFT',$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.soNumber, data.customerId, data.orderDate || new Date().toISOString().slice(0, 10),
      data.requiredByDate || null, subtotal, data.taxAmount || 0, totalAmount, data.notes || null, userId,
    ]
  );
  return rows[0];
}

async function createItem(soId, item, client) {
  const executor = client || { query };
  const lineTotal = item.quantityMeters * item.unitPrice;
  const { rows } = await executor.query(
    `INSERT INTO sales_order_items (sales_order_id, fabric_design_id, quantity_meters, unit_price, line_total)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [soId, item.fabricDesignId, item.quantityMeters, item.unitPrice, lineTotal]
  );
  return rows[0];
}

async function updateStatus(id, status, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

async function incrementItemDispatched(itemId, quantity, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE sales_order_items SET quantity_dispatched_meters = quantity_dispatched_meters + $1 WHERE id = $2 RETURNING *`,
    [quantity, itemId]
  );
  return rows[0];
}

async function recordPayment(id, amount, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE sales_orders SET amount_paid = amount_paid + $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [amount, id]
  );
  return rows[0];
}

module.exports = {
  list, findById, findByNumber, findItemsBySO, findItemById,
  create, createItem, updateStatus, incrementItemDispatched, recordPayment,
};
