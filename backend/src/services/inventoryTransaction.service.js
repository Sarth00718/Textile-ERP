const repo = require('../repositories/inventory.repository');
const txnRepo = require('../repositories/inventoryTransaction.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { notifyRoles } = require('./notification.service');

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

  const txn = await txnRepo.create(data, userId);

  // After any OUT or ADJUSTMENT, check if stock has hit reorder level
  if (['OUT', 'ADJUSTMENT'].includes(data.txnType)) {
    const updatedItem = await repo.findById(data.inventoryItemId);
    if (updatedItem && Number(updatedItem.current_stock) <= Number(updatedItem.reorder_level)) {
      await notifyRoles({
        roles: ['OWNER', 'MANAGER'],
        title: 'Low Stock Alert',
        message: `${updatedItem.name} (${updatedItem.item_code}) stock is now ${updatedItem.current_stock} ${updatedItem.unit}, at or below reorder level of ${updatedItem.reorder_level}.`,
        severity: 'WARNING',
        module: 'inventory',
        referenceType: 'inventory_items',
        referenceId: updatedItem.id,
      }).catch(() => {});
    }
  }

  return txn;
}

module.exports = { listTransactions, createTransaction };
