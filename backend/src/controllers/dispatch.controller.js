const service = require('../services/dispatch.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'dispatch_no', header: 'Dispatch No' },
  { key: 'so_number', header: 'Sales Order' },
  { key: 'customer_name', header: 'Customer' },
  { key: 'vehicle_number', header: 'Vehicle' },
  { key: 'dispatch_date', header: 'Date' },
  { key: 'status', header: 'Status' },
  { key: 'total_weight_kg', header: 'Total Weight (kg)' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listDispatches(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'dispatches', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'dispatches', EXPORT_COLUMNS, result.items, 'Dispatches');
  if (req.query.format === 'pdf') return exportPdf(res, 'dispatches', 'Dispatch List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const d = await service.getDispatch(req.params.id);
  res.json({ success: true, data: d });
});

const create = asyncHandler(async (req, res) => {
  const d = await service.createDispatch(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'dispatches', entityId: d.id, newValues: d, req });
  res.status(201).json({ success: true, data: d });
});

const markInTransit = asyncHandler(async (req, res) => {
  const d = await service.markInTransit(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'IN_TRANSIT', entityType: 'dispatches', entityId: d.id, newValues: d, req });
  res.json({ success: true, data: d });
});

const markDelivered = asyncHandler(async (req, res) => {
  const d = await service.markDelivered(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELIVERED', entityType: 'dispatches', entityId: d.id, newValues: d, req });
  res.json({ success: true, data: d });
});

module.exports = { list, getOne, create, markInTransit, markDelivered };
