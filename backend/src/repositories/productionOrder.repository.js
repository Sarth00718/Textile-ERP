const { query } = require('../config/db');

async function list({ status, machineId, workOrderId, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`po.status = $${params.length}`);
  }
  if (machineId) {
    params.push(machineId);
    conditions.push(`po.machine_id = $${params.length}`);
  }
  if (workOrderId) {
    params.push(workOrderId);
    conditions.push(`po.work_order_id = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM production_orders po ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT po.*, m.name AS machine_name, m.machine_code, wo.work_order_no,
            e.full_name AS operator_name, b.beam_code
     FROM production_orders po
     JOIN machines m ON m.id = po.machine_id
     JOIN work_orders wo ON wo.id = po.work_order_id
     LEFT JOIN employees e ON e.id = po.assigned_operator_id
     LEFT JOIN beams b ON b.id = po.beam_id
     ${whereClause} ORDER BY po.created_at DESC`;

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
    `SELECT po.*, m.name AS machine_name, m.machine_code, wo.work_order_no, wo.fabric_design_id,
            e.full_name AS operator_name, b.beam_code
     FROM production_orders po
     JOIN machines m ON m.id = po.machine_id
     JOIN work_orders wo ON wo.id = po.work_order_id
     LEFT JOIN employees e ON e.id = po.assigned_operator_id
     LEFT JOIN beams b ON b.id = po.beam_id
     WHERE po.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByNumber(productionOrderNo) {
  const { rows } = await query('SELECT * FROM production_orders WHERE production_order_no = $1', [productionOrderNo]);
  return rows[0] || null;
}

async function create(data, userId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO production_orders (production_order_no, work_order_id, machine_id, beam_id,
       target_quantity_meters, status, assigned_operator_id, start_date, end_date, created_by)
     VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7,$8,$9) RETURNING *`,
    [
      data.productionOrderNo, data.workOrderId, data.machineId, data.beamId || null,
      data.targetQuantityMeters, data.assignedOperatorId || null, data.startDate || null,
      data.endDate || null, userId,
    ]
  );
  return rows[0];
}

async function update(id, data, client = null) {
  const executor = client || { query };
  const fields = [];
  const params = [];
  const map = { status: 'status', assignedOperatorId: 'assigned_operator_id', beamId: 'beam_id', endDate: 'end_date' };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await executor.query(`UPDATE production_orders SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

/**
 * Atomically increments produced_quantity_meters and flips status to
 * IN_PROGRESS (if PENDING) or COMPLETED (if target reached). Returns the
 * updated row so the caller can decide whether to cascade further
 * (e.g. update the parent work order).
 */
async function incrementProduced(id, quantityMeters, client) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE production_orders
     SET produced_quantity_meters = produced_quantity_meters + $1,
         status = CASE
           WHEN status = 'PENDING' THEN 'IN_PROGRESS'
           WHEN produced_quantity_meters + $1 >= target_quantity_meters THEN 'COMPLETED'
           ELSE status
         END,
         updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [quantityMeters, id]
  );
  return rows[0];
}

async function remove(id, client = null) {
  const executor = client || { query };
  await executor.query('DELETE FROM production_orders WHERE id = $1', [id]);
}

/**
 * Find any active (non-completed, non-cancelled) PO for a given machine.
 * Used to prevent overbooking the same machine.
 */
async function findActiveByMachine(machineId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `SELECT id, production_order_no, status FROM production_orders
     WHERE machine_id = $1 AND status IN ('PENDING','IN_PROGRESS','ON_HOLD')
     LIMIT 1`,
    [machineId]
  );
  return rows[0] || null;
}

/**
 * Count non-cancelled POs under a work order.
 * Used to decide if work order should revert to PLANNED on PO deletion.
 */
async function countByWorkOrder(workOrderId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `SELECT COUNT(*) FROM production_orders WHERE work_order_id = $1 AND status != 'CANCELLED'`,
    [workOrderId]
  );
  return parseInt(rows[0].count, 10);
}

module.exports = {
  list, findById, findByNumber, create, update, incrementProduced,
  remove, findActiveByMachine, countByWorkOrder,
};
