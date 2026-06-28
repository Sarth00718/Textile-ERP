const repo = require('../repositories/supplier.repository');
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
  await repo.remove(id);
}

module.exports = { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
