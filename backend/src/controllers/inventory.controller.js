const itemService = require('../services/inventory.service');
const txnService = require('../services/inventoryTransaction.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const ITEM_EXPORT_COLUMNS = [
  { key: 'item_code', header: 'Item Code' },
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Category' },
  { key: 'unit', header: 'Unit' },
  { key: 'current_stock', header: 'Current Stock' },
  { key: 'reorder_level', header: 'Reorder Level' },
  { key: 'unit_cost', header: 'Unit Cost' },
];

const list = asyncHandler(async (req, res) => {
  const result = await itemService.listItems(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'inventory', ITEM_EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'inventory', ITEM_EXPORT_COLUMNS, result.items, 'Inventory');
  if (req.query.format === 'pdf') return exportPdf(res, 'inventory', 'Inventory Items', ITEM_EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const lowStock = asyncHandler(async (req, res) => {
  const items = await itemService.getLowStockAlerts();
  res.json({ success: true, data: items });
});

const getOne = asyncHandler(async (req, res) => {
  const item = await itemService.getItem(req.params.id);
  res.json({ success: true, data: item });
});

const create = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'inventory_items', entityId: item.id, newValues: item, req });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const before = await itemService.getItem(req.params.id);
  const item = await itemService.updateItem(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'inventory_items', entityId: item.id, oldValues: before, newValues: item, req });
  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const before = await itemService.getItem(req.params.id);
  await itemService.deleteItem(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'inventory_items', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Inventory item deleted successfully' });
});

// ---- Transactions ----
const listTransactions = asyncHandler(async (req, res) => {
  const result = await txnService.listTransactions(req.query);
  res.json({ success: true, ...result });
});

const createTransaction = asyncHandler(async (req, res) => {
  const txn = await txnService.createTransaction(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'inventory_transactions', entityId: txn.id, newValues: txn, req });
  res.status(201).json({ success: true, data: txn });
});

module.exports = { list, lowStock, getOne, create, update, remove, listTransactions, createTransaction };
