const { query } = require('../config/db');

async function nextDispatchNumber() {
  const { rows } = await query(
    `SELECT 'DSP-' || LPAD((COALESCE(MAX(SUBSTRING(dispatch_no FROM 5)::INT), 0) + 1)::TEXT, 6, '0') AS next_no
     FROM dispatches WHERE dispatch_no ~ '^DSP-[0-9]+$'`
  );
  return rows[0].next_no;
}

async function create(data, customerId, totalWeight, totalPackages, userId, client) {
  const executor = client || { query };
  const dispatchNo = await nextDispatchNumber();
  const { rows } = await executor.query(
    `INSERT INTO dispatches (dispatch_no, sales_order_id, customer_id, vehicle_id, dispatch_date, status, total_weight_kg, total_packages, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7,$8,$9) RETURNING *`,
    [
      dispatchNo, data.salesOrderId, customerId, data.vehicleId || null,
      data.dispatchDate || new Date().toISOString().slice(0, 10), totalWeight, totalPackages, data.notes || null, userId,
    ]
  );
  return rows[0];
}

async function createItem(dispatchId, packingRecordId, fabricRollId, quantityMeters, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO dispatch_items (dispatch_id, packing_record_id, fabric_roll_id, quantity_meters)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [dispatchId, packingRecordId, fabricRollId, quantityMeters]
  );
  return rows[0];
}

async function findItemsByDispatch(dispatchId) {
  const { rows } = await query(
    `SELECT di.*, fr.roll_no, fr.fabric_design_id FROM dispatch_items di
     JOIN fabric_rolls fr ON fr.id = di.fabric_roll_id WHERE di.dispatch_id = $1`,
    [dispatchId]
  );
  return rows;
}

async function list({ status, salesOrderId, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`d.status = $${params.length}`);
  }
  if (salesOrderId) {
    params.push(salesOrderId);
    conditions.push(`d.sales_order_id = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM dispatches d ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT d.*, so.so_number, c.name AS customer_name, v.vehicle_number
     FROM dispatches d
     JOIN sales_orders so ON so.id = d.sales_order_id
     JOIN customers c ON c.id = d.customer_id
     LEFT JOIN vehicles v ON v.id = d.vehicle_id
     ${whereClause} ORDER BY d.dispatch_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT d.*, so.so_number, c.name AS customer_name, v.vehicle_number
     FROM dispatches d
     JOIN sales_orders so ON so.id = d.sales_order_id
     JOIN customers c ON c.id = d.customer_id
     LEFT JOIN vehicles v ON v.id = d.vehicle_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function setStatus(id, status, deliveredAt, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE dispatches SET status = $1, delivered_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [status, deliveredAt || null, id]
  );
  return rows[0];
}

module.exports = { create, createItem, findItemsByDispatch, list, findById, setStatus, nextDispatchNumber };
