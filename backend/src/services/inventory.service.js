const repo = require('../repositories/inventory.repository');
const txnRepo = require('../repositories/inventoryTransaction.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listItems(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getItem(id) {
  const item = await repo.findById(id);
  if (!item) throw ApiError.notFound('Inventory item not found');
  return item;
}

async function createItem(data, userId) {
  const existing = await repo.findByCode(data.itemCode);
  if (existing) throw ApiError.conflict('An inventory item with this code already exists');
  const item = await repo.create(data, userId);
  if (data.openingStock > 0) {
    // Log the opening balance as a genuine IN transaction for full traceability,
    // without double-applying it to current_stock (already set at insert time).
    await txnRepo.create(
      { inventoryItemId: item.id, txnType: 'ADJUSTMENT', quantity: item.current_stock, unitCost: data.unitCost, notes: 'Opening stock balance' },
      userId
    );
  }
  return item;
}

async function updateItem(id, data) {
  await getItem(id);
  return repo.update(id, data);
}

async function deleteItem(id) {
  await getItem(id);
  await repo.remove(id);
}

async function getLowStockAlerts() {
  return repo.getLowStockItems();
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, getLowStockAlerts };
