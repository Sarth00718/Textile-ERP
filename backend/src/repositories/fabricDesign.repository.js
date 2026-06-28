const { query } = require('../config/db');

const COLUMN_MAP = {
  designCode: 'design_code', name: 'name', fabricType: 'fabric_type', widthInches: 'width_inches',
  weightGsm: 'weight_gsm', warpYarnCount: 'warp_yarn_count', weftYarnCount: 'weft_yarn_count',
  weavePattern: 'weave_pattern', color: 'color', imageUrl: 'image_url', standardRate: 'standard_rate',
  isActive: 'is_active',
};

async function list({ search, fabricType, isActive, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR design_code ILIKE $${params.length})`);
  }
  if (fabricType) {
    params.push(fabricType);
    conditions.push(`fabric_type = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive === 'true');
    conditions.push(`is_active = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM fabric_designs ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM fabric_designs ${whereClause} ORDER BY created_at DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM fabric_designs WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM fabric_designs WHERE design_code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO fabric_designs (design_code, name, fabric_type, width_inches, weight_gsm, warp_yarn_count,
       weft_yarn_count, weave_pattern, color, image_url, standard_rate, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      data.designCode, data.name, data.fabricType, data.widthInches || null, data.weightGsm || null,
      data.warpYarnCount || null, data.weftYarnCount || null, data.weavePattern || null, data.color || null,
      data.imageUrl || null, data.standardRate || null, data.isActive ?? true, userId,
    ]
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
  const { rows } = await query(`UPDATE fabric_designs SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM fabric_designs WHERE id = $1', [id]);
}

module.exports = { list, findById, findByCode, create, update, remove };
