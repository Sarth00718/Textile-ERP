const repo = require('../repositories/inventory.repository');
const txnRepo = require('../repositories/inventoryTransaction.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listTransactions(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await txnRepo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function createTransaction(data, userId) {
  const item = await repo.findById(data.inventoryItemId);
  if (!item) throw ApiError.notFound('Inventory item not found');
  if (data.txnType === 'OUT' && Number(item.current_stock) < Number(data.quantity)) {
    throw ApiError.conflict(`Insufficient stock: available ${item.current_stock} ${item.unit}`);
  }
  return txnRepo.create(data, userId);
}

module.exports = { listTransactions, createTransaction };
