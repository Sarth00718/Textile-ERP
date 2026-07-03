const { query } = require('../config/db');

async function list({ status, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`wo.status = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM work_orders wo ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT wo.*, fd.name AS fabric_design_name, fd.design_code, so.so_number
     FROM work_orders wo
     JOIN fabric_designs fd ON fd.id = wo.fabric_design_id
     LEFT JOIN sales_orders so ON so.id = wo.sales_order_id
     ${whereClause} ORDER BY wo.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT wo.*, fd.name AS fabric_design_name, fd.design_code, so.so_number
     FROM work_orders wo
     JOIN fabric_designs fd ON fd.id = wo.fabric_design_id
     LEFT JOIN sales_orders so ON so.id = wo.sales_order_id
     WHERE wo.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByNumber(workOrderNo) {
  const { rows } = await query('SELECT * FROM work_orders WHERE work_order_no = $1', [workOrderNo]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO work_orders (work_order_no, production_plan_id, fabric_design_id, sales_order_id,
       target_quantity_meters, status, start_date, due_date, created_by)
     VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7,$8) RETURNING *`,
    [
      data.workOrderNo, data.productionPlanId || null, data.fabricDesignId, data.salesOrderId || null,
      data.targetQuantityMeters, data.startDate || null, data.dueDate || null, userId,
    ]
  );
  return rows[0];
}

async function update(id, data, client = null) {
  const executor = client || { query };
  const fields = [];
  const params = [];
  const map = { status: 'status', targetQuantityMeters: 'target_quantity_meters', startDate: 'start_date', dueDate: 'due_date' };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await executor.query(`UPDATE work_orders SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM work_orders WHERE id = $1', [id]);
}

/**
 * Returns true if every non-CANCELLED production order under this
 * work order is COMPLETED — used to auto-complete the work order.
 */
async function checkAllPOsCompleted(workOrderId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
            COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED','CANCELLED')) AS pending
     FROM production_orders WHERE work_order_id = $1`,
    [workOrderId]
  );
  const r = rows[0];
  return parseInt(r.total, 10) > 0 && parseInt(r.pending, 10) === 0;
}

module.exports = { list, findById, findByNumber, create, update, remove, checkAllPOsCompleted };
