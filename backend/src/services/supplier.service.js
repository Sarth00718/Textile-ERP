const repo = require('../repositories/supplier.repository');
const { query } = require('../config/db');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listSuppliers(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getSupplier(id) {
  const supplier = await repo.findById(id);
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return supplier;
}

async function createSupplier(data, userId) {
  const existing = await repo.findByCode(data.supplierCode);
  if (existing) throw ApiError.conflict('A supplier with this code already exists');
  return repo.create(data, userId);
}

async function updateSupplier(id, data) {
  await getSupplier(id);
  return repo.update(id, data);
}

async function deleteSupplier(id) {
  await getSupplier(id);
  // Guard: cannot deactivate if there are open/pending purchase orders
  const { rows } = await query(
    `SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = $1 AND status NOT IN ('RECEIVED','CANCELLED')`,
    [id]
  );
  if (parseInt(rows[0].count, 10) > 0) {
    throw ApiError.conflict('Cannot deactivate this supplier — they have open purchase orders. Close or cancel those orders first.');
  }
  await repo.remove(id);
}

module.exports = { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
