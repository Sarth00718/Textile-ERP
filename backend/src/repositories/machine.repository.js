const { query } = require('../config/db');
const { safeSortColumn, safeSortDirection } = require('../utils/queryHelpers');

const SORTABLE = ['machine_code', 'name', 'status', 'created_at'];

const COLUMN_MAP = {
  machineCode: 'machine_code',
  name: 'name',
  machineType: 'machine_type',
  manufacturer: 'manufacturer',
  modelNumber: 'model_number',
  departmentId: 'department_id',
  installationDate: 'installation_date',
  ratedSpeed: 'rated_speed',
  ratedPowerKw: 'rated_power_kw',
  location: 'location',
  isActive: 'is_active',
};

async function list({ search, status, departmentId, sortBy, sortDir, limit, offset }) {
  const conditions = ['m.is_active = TRUE'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(m.name ILIKE $${params.length} OR m.machine_code ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`m.status = $${params.length}`);
  }
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`m.department_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = safeSortColumn(sortBy, SORTABLE, 'machine_code');
  const sortDirection = safeSortDirection(sortDir);

  const countRes = await query(`SELECT COUNT(*) FROM machines m ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT m.*, d.name AS department_name, e.full_name AS current_operator_name
    FROM machines m
    LEFT JOIN departments d ON d.id = m.department_id
    LEFT JOIN employees e ON e.id = m.current_operator_id
    ${whereClause}
    ORDER BY m.${sortCol} ${sortDirection}`;

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
    `SELECT m.*, d.name AS department_name, e.full_name AS current_operator_name
     FROM machines m
     LEFT JOIN departments d ON d.id = m.department_id
     LEFT JOIN employees e ON e.id = m.current_operator_id
     WHERE m.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM machines WHERE machine_code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO machines (machine_code, name, machine_type, manufacturer, model_number, department_id,
       installation_date, rated_speed, rated_power_kw, location, is_active, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING *`,
    [
      data.machineCode, data.name, data.machineType, data.manufacturer || null, data.modelNumber || null,
      data.departmentId || null, data.installationDate || null, data.ratedSpeed || null,
      data.ratedPowerKw || null, data.location || null, data.isActive ?? true, userId,
    ]
  );
  return rows[0];
}

async function update(id, data, userId) {
  const fields = [];
  const params = [];
  for (const [key, col] of Object.entries(COLUMN_MAP)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  params.push(userId);
  fields.push(`updated_by = $${params.length}`);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE machines SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function setStatus(id, status, operatorId, client = null) {
  const executor = client || { query };
  const fields = ['status = $1', 'updated_at = NOW()'];
  const params = [status];
  if (operatorId !== undefined) {
    params.push(operatorId);
    fields.push(`current_operator_id = $${params.length}`);
  }
  params.push(id);
  const { rows } = await executor.query(
    `UPDATE machines SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0];
}

async function remove(id) {
  // Soft-delete: machines may be referenced by production_orders (ON DELETE RESTRICT)
  await query('UPDATE machines SET is_active = FALSE, status = $2, updated_at = NOW() WHERE id = $1', [id, 'OFFLINE']);
}

async function getUtilizationSummary() {
  const { rows } = await query(`
    SELECT status, COUNT(*) AS count FROM machines WHERE is_active = TRUE GROUP BY status
  `);
  return rows;
}

module.exports = { list, findById, findByCode, create, update, setStatus, remove, getUtilizationSummary };
