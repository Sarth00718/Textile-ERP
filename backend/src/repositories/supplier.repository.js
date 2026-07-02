const { query } = require('../config/db');

const COLUMN_MAP = {
  name: 'name', contactPerson: 'contact_person', phone: 'phone', email: 'email', address: 'address',
  gstNumber: 'gst_number', paymentTerms: 'payment_terms', rating: 'rating', isActive: 'is_active',
};

async function list({ search, isActive, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR supplier_code ILIKE $${params.length})`);
  }
  if (isActive !== undefined) {
    params.push(isActive === 'true');
    conditions.push(`is_active = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM suppliers ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM suppliers ${whereClause} ORDER BY name`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM suppliers WHERE supplier_code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, address, gst_number, payment_terms, rating, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      data.supplierCode, data.name, data.contactPerson || null, data.phone || null, data.email || null,
      data.address || null, data.gstNumber || null, data.paymentTerms || null, data.rating || 0,
      data.isActive ?? true, userId,
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
  const { rows } = await query(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  // Soft-delete: suppliers may be referenced by purchase_orders (ON DELETE RESTRICT)
  await query('UPDATE suppliers SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
}

module.exports = { list, findById, findByCode, create, update, remove };
