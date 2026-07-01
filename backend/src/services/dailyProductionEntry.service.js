const repo = require('../repositories/dailyProductionEntry.repository');
const productionOrderRepo = require('../repositories/productionOrder.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const inventoryRepo = require('../repositories/inventory.repository');
const machineOpsRepo = require('../repositories/machineOps.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

async function listEntries(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit: reqQuery.format ? undefined : limit, offset: reqQuery.format ? undefined : offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getEntry(id) {
  const entry = await repo.findById(id);
  if (!entry) throw ApiError.notFound('Daily production entry not found');
  return entry;
}

/**
 * Recording a daily production entry is the single most consequential write
 * in the system. Per the spec's cross-module synchronization requirement,
 * within ONE transaction it must:
 *
 *   1. Insert the daily_production_entries row
 *   2. Increment produced_quantity_meters on the parent production_order
 *      (and auto-transition PENDING -> IN_PROGRESS -> COMPLETED)
 *   3. Optionally consume raw material from inventory (creates an
 *      inventory_transactions row + raw_material_consumptions row + decrements stock)
 *   4. Optionally create a fabric_roll (status PRODUCED) tied to this entry
 *   5. Log a machine_logs IDLE/STOP-adjacent runtime note is NOT auto-created
 *      here (operators log machine start/stop independently via Machine Logs),
 *      but if the production order just completed, the machine is freed.
 *
 * If any step fails, the whole entry is rolled back so no module is left
 * out of sync with another — this directly implements the workflow spec's
 * "Everything must remain synchronized" requirement.
 */
async function createEntry(data, userId) {
  const productionOrder = await productionOrderRepo.findById(data.productionOrderId);
  if (!productionOrder) throw ApiError.notFound('Production order not found');
  if (productionOrder.status === 'COMPLETED' || productionOrder.status === 'CANCELLED') {
    throw ApiError.conflict(`Cannot log production against a ${productionOrder.status} production order`);
  }

  let rawMaterialItem = null;
  if (data.rawMaterialItemId) {
    rawMaterialItem = await inventoryRepo.findById(data.rawMaterialItemId);
    if (!rawMaterialItem) throw ApiError.notFound('Raw material inventory item not found');
    const qtyNeeded = data.rawMaterialQuantity || data.yarnConsumedKg || 0;
    if (qtyNeeded > 0 && Number(rawMaterialItem.current_stock) < qtyNeeded) {
      throw ApiError.conflict(
        `Insufficient stock of ${rawMaterialItem.name}: available ${rawMaterialItem.current_stock} ${rawMaterialItem.unit}, need ${qtyNeeded}`
      );
    }
  }

  const result = await withTransaction(async (client) => {
    // 1. Daily production entry
    const entry = await repo.create({ ...data, machineId: productionOrder.machine_id }, userId, client);

    // 2. Cascade to production order
    const updatedPO = await productionOrderRepo.incrementProduced(data.productionOrderId, data.quantityProducedMeters, client);

    // 2b. If the production order just completed, release the machine back to IDLE
    // so it is immediately available for the next assignment.
    if (updatedPO.status === 'COMPLETED') {
      await client.query(`UPDATE machines SET status = 'IDLE', updated_at = NOW() WHERE id = $1`, [productionOrder.machine_id]);
    }

    // 3. Raw material consumption -> inventory transaction -> stock decrement
    let consumption = null;
    if (rawMaterialItem) {
      const qty = data.rawMaterialQuantity || data.yarnConsumedKg || 0;
      if (qty > 0) {
        const newStock = Number(rawMaterialItem.current_stock) - qty;
        await client.query(
          `INSERT INTO raw_material_consumptions (production_order_id, inventory_item_id, daily_production_entry_id, quantity_consumed, consumption_date, created_by)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [data.productionOrderId, data.rawMaterialItemId, entry.id, qty, data.entryDate || new Date().toISOString().slice(0, 10), userId]
        );
        await client.query(`UPDATE inventory_items SET current_stock = $1, updated_at = NOW() WHERE id = $2`, [newStock, data.rawMaterialItemId]);
        await client.query(
          `INSERT INTO inventory_transactions (inventory_item_id, txn_type, quantity, balance_after, reference_type, reference_id, performed_by)
           VALUES ($1,'OUT',$2,$3,'daily_production_entries',$4,$5)`,
          [data.rawMaterialItemId, qty, newStock, entry.id, userId]
        );
        consumption = { itemId: data.rawMaterialItemId, quantity: qty, newStock };
      }
    }

    // 4. Fabric roll creation
    let roll = null;
    if (data.createFabricRoll !== false && data.quantityProducedMeters > 0) {
      roll = await fabricRollRepo.create(
        {
          productionOrderId: data.productionOrderId,
          dailyProductionEntryId: entry.id,
          fabricDesignId: productionOrder.fabric_design_id,
          lengthMeters: data.quantityProducedMeters,
          weightKg: data.rollWeightKg || null,
          warehouseLocation: data.warehouseLocation || null,
        },
        client
      );
    }

    return { entry, productionOrder: updatedPO, consumption, roll };
  });

  if (result.productionOrder.status === 'COMPLETED') {
    await notifyRoles({
      roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
      title: 'Production Order Completed',
      message: `Production order ${result.productionOrder.production_order_no} reached its target quantity.`,
      severity: 'INFO',
      module: 'productionOrders',
      referenceType: 'production_orders',
      referenceId: result.productionOrder.id,
    }).catch(() => {});
  }

  if (rawMaterialItem && result.consumption && Number(result.consumption.newStock) <= Number(rawMaterialItem.reorder_level)) {
    await notifyRoles({
      roles: ['OWNER', 'MANAGER'],
      title: 'Low Inventory Alert',
      message: `${rawMaterialItem.name} stock is now ${result.consumption.newStock} ${rawMaterialItem.unit}, at or below reorder level (${rawMaterialItem.reorder_level}).`,
      severity: 'WARNING',
      module: 'inventory',
      referenceType: 'inventory_items',
      referenceId: rawMaterialItem.id,
    }).catch(() => {});
  }

  return result;
}

module.exports = { listEntries, getEntry, createEntry };
