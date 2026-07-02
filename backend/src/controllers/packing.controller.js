const service = require('../services/packing.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'package_no', header: 'Package No' },
  { key: 'roll_no', header: 'Roll No' },
  { key: 'package_type', header: 'Package Type' },
  { key: 'package_weight_kg', header: 'Weight (kg)' },
  { key: 'status', header: 'Status' },
  { key: 'packed_at', header: 'Packed At' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listPackingRecords(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'packing-records', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'packing-records', EXPORT_COLUMNS, result.items, 'Packing Records');
  if (req.query.format === 'pdf') return exportPdf(res, 'packing-records', 'Packing Records', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const rec = await service.getPackingRecord(req.params.id);
  res.json({ success: true, data: rec });
});

const create = asyncHandler(async (req, res) => {
  const rec = await service.createPackingRecord(req.body);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'packing_records', entityId: rec.id, newValues: rec, req });
  res.status(201).json({ success: true, data: rec });
});

module.exports = { list, getOne, create };
