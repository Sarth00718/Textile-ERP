const { query } = require('../config/db');

async function listBeams({ status, search, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(beam_code ILIKE $${params.length} OR yarn_count ILIKE $${params.length})`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM beams ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM beams ${whereClause} ORDER BY created_at DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findBeamById(id) {
  const { rows } = await query('SELECT * FROM beams WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findBeamByCode(code) {
  const { rows } = await query('SELECT * FROM beams WHERE beam_code = $1', [code]);
  return rows[0] || null;
}

async function createBeam(data, userId) {
  const { rows } = await query(
    `INSERT INTO beams (beam_code, beam_type, yarn_count, total_ends, length_meters, status, created_by)
     VALUES ($1,$2,$3,$4,$5,'IN_STOCK',$6) RETURNING *`,
    [data.beamCode, data.beamType || 'WARP', data.yarnCount || null, data.totalEnds || null, data.lengthMeters || null, userId]
  );
  return rows[0];
}

async function updateBeam(id, data) {
  const fields = [];
  const params = [];
  const map = {
    beamType: 'beam_type', yarnCount: 'yarn_count', totalEnds: 'total_ends',
    lengthMeters: 'length_meters', status: 'status',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findBeamById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE beams SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function setBeamStatus(id, status, currentMachineId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE beams SET status = $1, current_machine_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [status, currentMachineId, id]
  );
  return rows[0];
}

async function removeBeam(id) {
  await query('DELETE FROM beams WHERE id = $1', [id]);
}

// ---- Beam Allocations ----

async function createAllocation(data, userId, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO beam_allocations (beam_id, machine_id, allocated_by, notes)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.beamId, data.machineId, userId, data.notes || null]
  );
  return rows[0];
}

async function findActiveAllocationForBeam(beamId) {
  const { rows } = await query('SELECT * FROM beam_allocations WHERE beam_id = $1 AND is_active = TRUE', [beamId]);
  return rows[0] || null;
}

async function findActiveAllocationForMachine(machineId) {
  const { rows } = await query(
    `SELECT ba.*, b.beam_code FROM beam_allocations ba
     JOIN beams b ON b.id = ba.beam_id
     WHERE ba.machine_id = $1 AND ba.is_active = TRUE`,
    [machineId]
  );
  return rows[0] || null;
}

async function findAllocationById(id) {
  const { rows } = await query(
    `SELECT ba.*, b.beam_code, m.name AS machine_name, m.machine_code
     FROM beam_allocations ba JOIN beams b ON b.id = ba.beam_id JOIN machines m ON m.id = ba.machine_id
     WHERE ba.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function releaseAllocation(id, metersUsed, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE beam_allocations SET is_active = FALSE, released_at = NOW(), meters_used = $1 WHERE id = $2 RETURNING *`,
    [metersUsed || 0, id]
  );
  return rows[0];
}

async function listAllocations({ machineId, beamId, activeOnly, limit, offset }) {
  const conditions = [];
  const params = [];
  if (machineId) {
    params.push(machineId);
    conditions.push(`ba.machine_id = $${params.length}`);
  }
  if (beamId) {
    params.push(beamId);
    conditions.push(`ba.beam_id = $${params.length}`);
  }
  if (activeOnly === 'true') {
    conditions.push('ba.is_active = TRUE');
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM beam_allocations ba ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT ba.*, b.beam_code, m.name AS machine_name, m.machine_code
     FROM beam_allocations ba JOIN beams b ON b.id = ba.beam_id JOIN machines m ON m.id = ba.machine_id
     ${whereClause} ORDER BY ba.allocated_at DESC`;

  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

module.exports = {
  listBeams, findBeamById, findBeamByCode, createBeam, updateBeam, setBeamStatus, removeBeam,
  createAllocation, findActiveAllocationForBeam, findActiveAllocationForMachine,
  findAllocationById, releaseAllocation, listAllocations,
};
