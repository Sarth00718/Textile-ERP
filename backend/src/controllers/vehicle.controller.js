const service = require('../services/vehicle.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'vehicle_number', header: 'Vehicle Number' },
  { key: 'vehicle_type', header: 'Type' },
  { key: 'driver_name', header: 'Driver' },
  { key: 'driver_phone', header: 'Driver Phone' },
  { key: 'capacity_kg', header: 'Capacity (kg)' },
  { key: 'status', header: 'Status' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listVehicles(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'vehicles', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'vehicles', EXPORT_COLUMNS, result.items, 'Vehicles');
  if (req.query.format === 'pdf') return exportPdf(res, 'vehicles', 'Vehicle List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const v = await service.getVehicle(req.params.id);
  res.json({ success: true, data: v });
});

const create = asyncHandler(async (req, res) => {
  const v = await service.createVehicle(req.body);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'vehicles', entityId: v.id, newValues: v, req });
  res.status(201).json({ success: true, data: v });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getVehicle(req.params.id);
  const v = await service.updateVehicle(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'vehicles', entityId: v.id, oldValues: before, newValues: v, req });
  res.json({ success: true, data: v });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getVehicle(req.params.id);
  await service.deleteVehicle(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'vehicles', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Vehicle deleted successfully' });
});

module.exports = { list, getOne, create, update, remove };
