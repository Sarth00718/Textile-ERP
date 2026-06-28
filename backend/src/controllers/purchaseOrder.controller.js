const service = require('../services/purchaseOrder.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'po_number', header: 'PO Number' },
  { key: 'supplier_name', header: 'Supplier' },
  { key: 'order_date', header: 'Order Date' },
  { key: 'status', header: 'Status' },
  { key: 'total_amount', header: 'Total Amount' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listPOs(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'purchase-orders', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'purchase-orders', EXPORT_COLUMNS, result.items, 'Purchase Orders');
  if (req.query.format === 'pdf') return exportPdf(res, 'purchase-orders', 'Purchase Order List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const po = await service.getPO(req.params.id);
  res.json({ success: true, data: po });
});

const create = asyncHandler(async (req, res) => {
  const po = await service.createPO(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'purchase_orders', entityId: po.id, newValues: po, req });
  res.status(201).json({ success: true, data: po });
});

const send = asyncHandler(async (req, res) => {
  const po = await service.sendPO(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'SEND', entityType: 'purchase_orders', entityId: po.id, newValues: po, req });
  res.json({ success: true, data: po });
});

const cancel = asyncHandler(async (req, res) => {
  const po = await service.cancelPO(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'CANCEL', entityType: 'purchase_orders', entityId: po.id, newValues: po, req });
  res.json({ success: true, data: po });
});

const receive = asyncHandler(async (req, res) => {
  const po = await service.receivePO(req.params.id, req.body.receipts, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'RECEIVE', entityType: 'purchase_orders', entityId: po.id, newValues: po, req });
  res.json({ success: true, data: po });
});

module.exports = { list, getOne, create, send, cancel, receive };
