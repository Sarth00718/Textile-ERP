const { query } = require('../config/db');

const COLUMN_MAP = {
  vehicleType: 'vehicle_type', driverName: 'driver_name', driverPhone: 'driver_phone',
  capacityKg: 'capacity_kg', status: 'status', isActive: 'is_active',
};

async function list({ search, status, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(vehicle_number ILIKE $${params.length} OR driver_name ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM vehicles ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM vehicles ${whereClause} ORDER BY vehicle_number`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(
    `${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByNumber(vehicleNumber) {
  const { rows } = await query('SELECT * FROM vehicles WHERE vehicle_number = $1', [vehicleNumber]);
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO vehicles (vehicle_number, vehicle_type, driver_name, driver_phone, capacity_kg)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.vehicleNumber, data.vehicleType || null, data.driverName || null, data.driverPhone || null, data.capacityKg || null]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const params = [];
  for (const [key, col] of Object.entries(COLUMN_MAP)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function setStatus(id, status, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query('UPDATE vehicles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
  return rows[0];
}

async function remove(id) {
  await query('DELETE FROM vehicles WHERE id = $1', [id]);
}

module.exports = { list, findById, findByNumber, create, update, setStatus, remove };
