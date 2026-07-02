const repo = require('../repositories/purchaseOrder.repository');
const supplierRepo = require('../repositories/supplier.repository');
const inventoryRepo = require('../repositories/inventory.repository');
const txnRepo = require('../repositories/inventoryTransaction.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

async function listPOs(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit: reqQuery.format ? undefined : limit, offset: reqQuery.format ? undefined : offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getPO(id) {
  const po = await repo.findById(id);
  if (!po) throw ApiError.notFound('Purchase order not found');
  const items = await repo.findItemsByPO(id);
  return { ...po, items };
}

async function createPO(data, userId) {
  const existing = await repo.findByNumber(data.poNumber);
  if (existing) throw ApiError.conflict('A purchase order with this number already exists');
  const supplier = await supplierRepo.findById(data.supplierId);
  if (!supplier) throw ApiError.notFound('Supplier not found');

  for (const item of data.items) {
    const invItem = await inventoryRepo.findById(item.inventoryItemId);
    if (!invItem) throw ApiError.notFound(`Inventory item ${item.inventoryItemId} not found`);
  }

  const subtotal = data.items.reduce((sum, i) => sum + i.quantityOrdered * i.unitPrice, 0);
  const totalAmount = subtotal + (data.taxAmount || 0);

  return withTransaction(async (client) => {
    const po = await repo.create(data, subtotal, totalAmount, userId, client);
    const items = [];
    for (const item of data.items) {
      items.push(await repo.createItem(po.id, item, client));
    }
    return { ...po, items };
  });
}

async function sendPO(id) {
  const po = await getPO(id);
  if (po.status !== 'DRAFT') throw ApiError.conflict('Only DRAFT purchase orders can be sent');
  return repo.updateStatus(id, 'SENT');
}

async function cancelPO(id) {
  const po = await getPO(id);
  if (po.status === 'RECEIVED') throw ApiError.conflict('Cannot cancel a fully received purchase order');
  return repo.updateStatus(id, 'CANCELLED');
}

/**
 * Receiving goods against a PO must, in one transaction:
 *  - Increment quantity_received on each purchase_order_items row
 *  - Increase inventory_items.current_stock for each item
 *  - Record an inventory_transactions IN entry for traceability
 *  - Roll the PO status up to PARTIALLY_RECEIVED or RECEIVED based on totals
 * This implements "Purchase Order -> Inventory" from the workflow spec.
 */
async function receivePO(id, receipts, userId) {
  const po = await getPO(id);
  if (po.status === 'CANCELLED') throw ApiError.conflict('Cannot receive against a cancelled purchase order');
  if (po.status === 'RECEIVED') throw ApiError.conflict('This purchase order has already been fully received');

  const itemsById = new Map(po.items.map((i) => [i.id, i]));
  for (const r of receipts) {
    const poItem = itemsById.get(r.poItemId);
    if (!poItem) throw ApiError.badRequest(`Purchase order item ${r.poItemId} does not belong to this PO`);
    const remaining = Number(poItem.quantity_ordered) - Number(poItem.quantity_received);
    if (r.quantityReceived > remaining) {
      throw ApiError.badRequest(`Cannot receive ${r.quantityReceived}; only ${remaining} remaining for item ${poItem.item_name}`);
    }
  }

  const result = await withTransaction(async (client) => {
    for (const r of receipts) {
      const poItem = itemsById.get(r.poItemId);
      await repo.incrementItemReceived(r.poItemId, r.quantityReceived, client);

      const invItem = await inventoryRepo.findById(poItem.inventory_item_id);
      const newStock = Number(invItem.current_stock) + Number(r.quantityReceived);
      await inventoryRepo.adjustStock(poItem.inventory_item_id, newStock, client);
      await client.query(
        `INSERT INTO inventory_transactions (inventory_item_id, txn_type, quantity, balance_after, unit_cost, reference_type, reference_id, performed_by)
         VALUES ($1,'IN',$2,$3,$4,'purchase_orders',$5,$6)`,
        [poItem.inventory_item_id, r.quantityReceived, newStock, poItem.unit_price, id, userId]
      );
    }

    const refreshedItems = await repo.findItemsByPO(id);
    const fullyReceived = refreshedItems.every((i) => Number(i.quantity_received) >= Number(i.quantity_ordered));
    const partiallyReceived = refreshedItems.some((i) => Number(i.quantity_received) > 0);
    const newStatus = fullyReceived ? 'RECEIVED' : partiallyReceived ? 'PARTIALLY_RECEIVED' : po.status;
    const updatedPO = await repo.updateStatus(id, newStatus, client);

    return { ...updatedPO, items: refreshedItems };
  });

  // Notify managers of stock received
  await notifyRoles({
    roles: ['OWNER', 'MANAGER'],
    title: 'Purchase Order Goods Received',
    message: `Goods received against PO ${po.po_number}. Status: ${result.status}.`,
    severity: 'INFO',
    module: 'purchaseOrders',
    referenceType: 'purchase_orders',
    referenceId: id,
  }).catch(() => {});

  // Check for low stock on received items and fire alerts
  for (const r of receipts) {
    const poItem = itemsById.get(r.poItemId);
    const updatedItem = await inventoryRepo.findById(poItem.inventory_item_id);
    if (updatedItem && Number(updatedItem.current_stock) <= Number(updatedItem.reorder_level)) {
      await notifyRoles({
        roles: ['OWNER', 'MANAGER'],
        title: 'Low Stock Alert',
        message: `${updatedItem.name} stock is ${updatedItem.current_stock} ${updatedItem.unit}, at or below reorder level (${updatedItem.reorder_level}).`,
        severity: 'WARNING',
        module: 'inventory',
        referenceType: 'inventory_items',
        referenceId: updatedItem.id,
      }).catch(() => {});
    }
  }

  return result;
}

module.exports = { listPOs, getPO, createPO, sendPO, cancelPO, receivePO };
