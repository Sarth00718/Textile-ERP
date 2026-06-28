const service = require('../services/fabricRoll.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'roll_no', header: 'Roll No' },
  { key: 'fabric_design_name', header: 'Fabric Design' },
  { key: 'production_order_no', header: 'Production Order' },
  { key: 'length_meters', header: 'Length (m)' },
  { key: 'weight_kg', header: 'Weight (kg)' },
  { key: 'status', header: 'Status' },
  { key: 'warehouse_location', header: 'Location' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listRolls(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'fabric-rolls', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'fabric-rolls', EXPORT_COLUMNS, result.items, 'Fabric Rolls');
  if (req.query.format === 'pdf') return exportPdf(res, 'fabric-rolls', 'Fabric Roll List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const roll = await service.getRoll(req.params.id);
  res.json({ success: true, data: roll });
});

const updateStatus = asyncHandler(async (req, res) => {
  const before = await service.getRoll(req.params.id);
  const roll = await service.updateRollStatus(req.params.id, req.body.status);
  await recordAudit({ userId: req.user.id, action: 'UPDATE_STATUS', entityType: 'fabric_rolls', entityId: roll.id, oldValues: before, newValues: roll, req });
  res.json({ success: true, data: roll });
});

module.exports = { list, getOne, updateStatus };
