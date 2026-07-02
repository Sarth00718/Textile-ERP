const repo = require('../repositories/dispatch.repository');
const packingRepo = require('../repositories/packing.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const salesOrderRepo = require('../repositories/salesOrder.repository');
const vehicleRepo = require('../repositories/vehicle.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listDispatches(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getDispatch(id) {
  const d = await repo.findById(id);
  if (!d) throw ApiError.notFound('Dispatch not found');
  const items = await repo.findItemsByDispatch(id);
  return { ...d, items };
}

/**
 * Creating a dispatch is the culmination of the production->fulfillment
 * chain. In one transaction it must:
 *   1. Validate the sales order and every packing record (each roll must
 *      be PACKED, i.e. already QC-passed and packed).
 *   2. Create the dispatch + dispatch_items rows.
 *   3. Flip each fabric roll to DISPATCHED and each packing record to DISPATCHED.
 *   4. Roll up quantity_dispatched_meters on the relevant sales_order_items,
 *      then recompute the parent sales_order status (PARTIALLY_DISPATCHED
 *      vs DISPATCHED) -- this is "Dispatch -> Updates Sales Order".
 *   5. Mark the vehicle ON_TRIP if one was assigned.
 *
 * Note: dispatch does NOT separately decrement inventory_items, because in
 * this schema finished-goods stock is tracked via fabric_rolls.status
 * rather than a generic inventory_items row; a DISPATCHED roll is, by
 * definition, no longer available stock. This satisfies "Dispatch ->
 * Updates Inventory" using the roll-status model rather than a duplicate
 * ledger that could drift out of sync with it.
 */
async function createDispatch(data, userId) {
  const salesOrder = await salesOrderRepo.findById(data.salesOrderId);
  if (!salesOrder) throw ApiError.notFound('Sales order not found');
  if (!['CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIALLY_DISPATCHED'].includes(salesOrder.status)) {
    throw ApiError.conflict(`Cannot dispatch against a sales order with status ${salesOrder.status}`);
  }

  if (data.vehicleId) {
    const vehicle = await vehicleRepo.findById(data.vehicleId);
    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    if (vehicle.status !== 'AVAILABLE') throw ApiError.conflict('Vehicle is not currently available');
  }

  const packingRecords = [];
  for (const item of data.items) {
    const pr = await packingRepo.findById(item.packingRecordId);
    if (!pr) throw ApiError.notFound(`Packing record ${item.packingRecordId} not found`);
    if (pr.status !== 'PACKED') throw ApiError.conflict(`Packing record ${pr.package_no} is not in PACKED status`);
    packingRecords.push(pr);
  }

  const totalWeight = packingRecords.reduce((sum, pr) => sum + Number(pr.package_weight_kg || 0), 0);
  const soItems = await salesOrderRepo.findItemsBySO(data.salesOrderId);

  return withTransaction(async (client) => {
    const dispatch = await repo.create(data, salesOrder.customer_id, totalWeight, packingRecords.length, userId, client);

    const dispatchedByDesign = {};
    for (const pr of packingRecords) {
      await repo.createItem(dispatch.id, pr.id, pr.fabric_roll_id, pr.length_meters, client);
      await fabricRollRepo.setStatus(pr.fabric_roll_id, 'DISPATCHED', client);
      await packingRepo.setStatus(pr.id, 'DISPATCHED', client);
      dispatchedByDesign[pr.fabric_design_id] = (dispatchedByDesign[pr.fabric_design_id] || 0) + Number(pr.length_meters);
    }

    // Roll dispatched quantities up to matching sales_order_items by fabric design
    for (const soItem of soItems) {
      const dispatchedQty = dispatchedByDesign[soItem.fabric_design_id];
      if (dispatchedQty) {
        await salesOrderRepo.incrementItemDispatched(soItem.id, dispatchedQty, client);
      }
    }

    const refreshedItems = await salesOrderRepo.findItemsBySO(data.salesOrderId);
    const fullyDispatched = refreshedItems.every((i) => Number(i.quantity_dispatched_meters) >= Number(i.quantity_meters));
    const partiallyDispatched = refreshedItems.some((i) => Number(i.quantity_dispatched_meters) > 0);
    const newSOStatus = fullyDispatched ? 'DISPATCHED' : partiallyDispatched ? 'PARTIALLY_DISPATCHED' : salesOrder.status;
    await salesOrderRepo.updateStatus(data.salesOrderId, newSOStatus, client);

    if (data.vehicleId) {
      await vehicleRepo.setStatus(data.vehicleId, 'ON_TRIP', client);
    }

    return { ...dispatch, items: await repo.findItemsByDispatch(dispatch.id) };
  });
}

async function markInTransit(id) {
  const d = await getDispatch(id);
  if (d.status !== 'PENDING') throw ApiError.conflict('Only a PENDING dispatch can be marked in transit');
  return repo.setStatus(id, 'IN_TRANSIT', null);
}

/**
 * Marking a dispatch delivered frees the vehicle back to AVAILABLE.
 */
async function markDelivered(id) {
  const d = await getDispatch(id);
  if (d.status !== 'IN_TRANSIT') {
    throw ApiError.conflict(`Only an IN_TRANSIT dispatch can be marked as delivered (current status: ${d.status})`);
  }
  return withTransaction(async (client) => {
    const updated = await repo.setStatus(id, 'DELIVERED', new Date().toISOString(), client);
    if (d.vehicle_id) {
      await vehicleRepo.setStatus(d.vehicle_id, 'AVAILABLE', client);
    }
    return updated;
  });
}

module.exports = { listDispatches, getDispatch, createDispatch, markInTransit, markDelivered };
