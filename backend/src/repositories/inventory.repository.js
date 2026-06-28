const { query } = require('../config/db');
const { safeSortColumn, safeSortDirection } = require('../utils/queryHelpers');

const SORTABLE = ['name', 'item_code', 'current_stock', 'created_at'];

const COLUMN_MAP = {
  name: 'name', category: 'category', unit: 'unit', reorderLevel: 'reorder_level',
  maxStockLevel: 'max_stock_level', unitCost: 'unit_cost', warehouseLocation: 'warehouse_location',
  isActive: 'is_active',
};

async function list({ search, category, lowStockOnly, sortBy, sortDir, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR item_code ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (lowStockOnly === 'true') {
    conditions.push('current_stock <= reorder_level');
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = safeSortColumn(sortBy, SORTABLE, 'name');
  const sortDirection = safeSortDirection(sortDir);

  const countRes = await query(`SELECT COUNT(*) FROM inventory_items ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM inventory_items ${whereClause} ORDER BY ${sortCol} ${sortDirection}`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM inventory_items WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM inventory_items WHERE item_code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO inventory_items (item_code, name, category, unit, current_stock, reorder_level, max_stock_level, unit_cost, warehouse_location, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      data.itemCode, data.name, data.category || 'RAW_MATERIAL', data.unit || 'KG', data.openingStock || 0,
      data.reorderLevel || 0, data.maxStockLevel || null, data.unitCost || 0, data.warehouseLocation || null,
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
  const { rows } = await query(`UPDATE inventory_items SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function adjustStock(id, newStock, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `UPDATE inventory_items SET current_stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStock, id]
  );
  return rows[0];
}

async function remove(id) {
  await query('DELETE FROM inventory_items WHERE id = $1', [id]);
}

async function getLowStockItems() {
  const { rows } = await query('SELECT * FROM inventory_items WHERE current_stock <= reorder_level AND is_active = TRUE');
  return rows;
}

module.exports = { list, findById, findByCode, create, update, adjustStock, remove, getLowStockItems };
