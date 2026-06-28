const { query } = require('../config/db');

// ---- Machine Logs ----

async function createLog(data, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO machine_logs (machine_id, event_type, operator_id, shift_name, meter_reading, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.machineId, data.eventType, data.operatorId || null, data.shiftName || null, data.meterReading || null, data.notes || null]
  );
  return rows[0];
}

async function listLogs({ machineId, eventType, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (machineId) {
    params.push(machineId);
    conditions.push(`l.machine_id = $${params.length}`);
  }
  if (eventType) {
    params.push(eventType);
    conditions.push(`l.event_type = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`l.event_time >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`l.event_time <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM machine_logs l ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT l.*, m.name AS machine_name, m.machine_code, e.full_name AS operator_name
     FROM machine_logs l
     JOIN machines m ON m.id = l.machine_id
     LEFT JOIN employees e ON e.id = l.operator_id
     ${whereClause}
     ORDER BY l.event_time DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function getLastEventForMachine(machineId) {
  const { rows } = await query(
    'SELECT * FROM machine_logs WHERE machine_id = $1 ORDER BY event_time DESC LIMIT 1',
    [machineId]
  );
  return rows[0] || null;
}

// ---- Machine Breakdowns ----

async function createBreakdown(data, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO machine_breakdowns (machine_id, reported_by, issue_description, status)
     VALUES ($1,$2,$3,'OPEN') RETURNING *`,
    [data.machineId, data.reportedBy || null, data.issueDescription]
  );
  return rows[0];
}

async function listBreakdowns({ machineId, status, limit, offset }) {
  const conditions = [];
  const params = [];
  if (machineId) {
    params.push(machineId);
    conditions.push(`b.machine_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`b.status = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM machine_breakdowns b ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT b.*, m.name AS machine_name, m.machine_code
     FROM machine_breakdowns b JOIN machines m ON m.id = b.machine_id
     ${whereClause} ORDER BY b.reported_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findBreakdownById(id) {
  const { rows } = await query(
    `SELECT b.*, m.name AS machine_name, m.machine_code FROM machine_breakdowns b
     JOIN machines m ON m.id = b.machine_id WHERE b.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function resolveBreakdown(id, resolvedBy, resolutionNotes, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE machine_breakdowns SET status = 'RESOLVED', resolved_at = NOW(), resolved_by = $1,
       resolution_notes = $2, downtime_minutes = EXTRACT(EPOCH FROM (NOW() - reported_at)) / 60,
       updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [resolvedBy || null, resolutionNotes || null, id]
  );
  return rows[0];
}

// ---- Machine Maintenance ----

async function createMaintenance(data, userId) {
  const { rows } = await query(
    `INSERT INTO machine_maintenance (machine_id, maintenance_type, scheduled_date, performed_by, cost, description, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'SCHEDULED',$7) RETURNING *`,
    [data.machineId, data.maintenanceType || 'PREVENTIVE', data.scheduledDate, data.performedBy || null, data.cost || 0, data.description || null, userId]
  );
  return rows[0];
}

async function listMaintenance({ machineId, status, limit, offset }) {
  const conditions = [];
  const params = [];
  if (machineId) {
    params.push(machineId);
    conditions.push(`mm.machine_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`mm.status = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM machine_maintenance mm ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT mm.*, m.name AS machine_name, m.machine_code
     FROM machine_maintenance mm JOIN machines m ON m.id = mm.machine_id
     ${whereClause} ORDER BY mm.scheduled_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findMaintenanceById(id) {
  const { rows } = await query(
    `SELECT mm.*, m.name AS machine_name, m.machine_code FROM machine_maintenance mm
     JOIN machines m ON m.id = mm.machine_id WHERE mm.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function updateMaintenance(id, data, client = null) {
  const executor = client || { query };
  const fields = [];
  const params = [];
  const map = {
    status: 'status',
    completedDate: 'completed_date',
    performedBy: 'performed_by',
    cost: 'cost',
    description: 'description',
    partsReplaced: 'parts_replaced',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findMaintenanceById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await executor.query(`UPDATE machine_maintenance SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

module.exports = {
  createLog, listLogs, getLastEventForMachine,
  createBreakdown, listBreakdowns, findBreakdownById, resolveBreakdown,
  createMaintenance, listMaintenance, findMaintenanceById, updateMaintenance,
};
