const service = require('../services/operations.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

// ---- Electricity ----
const ELECTRICITY_COLUMNS = [
  { key: 'reading_date', header: 'Date' }, { key: 'department_name', header: 'Department' },
  { key: 'machine_name', header: 'Machine' }, { key: 'units_consumed', header: 'Units Consumed' },
  { key: 'cost_amount', header: 'Cost' },
];
const listElectricity = asyncHandler(async (req, res) => {
  const result = await service.listElectricityReadings(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'electricity', ELECTRICITY_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'electricity', ELECTRICITY_COLUMNS, result.items, 'Electricity');
  if (req.query.format === 'pdf') return exportPdf(res, 'electricity', 'Electricity Usage Report', ELECTRICITY_COLUMNS, result.items);
  res.json({ success: true, ...result });
});
const createElectricity = asyncHandler(async (req, res) => {
  const reading = await service.createElectricityReading(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'electricity_readings', entityId: reading.id, newValues: reading, req });
  res.status(201).json({ success: true, data: reading });
});

// ---- Water ----
const WATER_COLUMNS = [
  { key: 'reading_date', header: 'Date' }, { key: 'department_name', header: 'Department' },
  { key: 'units_consumed', header: 'Units Consumed' }, { key: 'cost_amount', header: 'Cost' },
];
const listWater = asyncHandler(async (req, res) => {
  const result = await service.listWaterReadings(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'water', WATER_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'water', WATER_COLUMNS, result.items, 'Water');
  if (req.query.format === 'pdf') return exportPdf(res, 'water', 'Water Usage Report', WATER_COLUMNS, result.items);
  res.json({ success: true, ...result });
});
const createWater = asyncHandler(async (req, res) => {
  const reading = await service.createWaterReading(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'water_readings', entityId: reading.id, newValues: reading, req });
  res.status(201).json({ success: true, data: reading });
});

// ---- Worker Productivity ----
const PRODUCTIVITY_COLUMNS = [
  { key: 'production_date', header: 'Date' },
  { key: 'employee_name', header: 'Employee' },
  { key: 'machine_name', header: 'Machine' },
  { key: 'quantity_produced_meters', header: 'Produced (m)' },
  { key: 'hours_worked', header: 'Hours Worked' },
  { key: 'efficiency_percent', header: 'Efficiency (m/hr)' },
  { key: 'defect_count', header: 'Defects' },
];
const listProductivity = asyncHandler(async (req, res) => {
  const result = await service.listProductivity(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'worker-productivity', PRODUCTIVITY_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'worker-productivity', PRODUCTIVITY_COLUMNS, result.items, 'Worker Productivity');
  if (req.query.format === 'pdf') return exportPdf(res, 'worker-productivity', 'Worker Productivity Report', PRODUCTIVITY_COLUMNS, result.items);
  res.json({ success: true, ...result });
});
const recordProductivity = asyncHandler(async (req, res) => {
  const record = await service.recordProductivity(req.body);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'worker_productivity', entityId: record.id, newValues: record, req });
  res.status(201).json({ success: true, data: record });
});

// ---- Waste Management ----
const WASTE_COLUMNS = [
  { key: 'waste_date', header: 'Date' }, { key: 'waste_type', header: 'Type' },
  { key: 'machine_name', header: 'Machine' }, { key: 'quantity_kg', header: 'Quantity (kg)' },
  { key: 'recovery_value', header: 'Recovery Value' },
];
const listWaste = asyncHandler(async (req, res) => {
  const result = await service.listWasteRecords(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'waste', WASTE_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'waste', WASTE_COLUMNS, result.items, 'Waste');
  if (req.query.format === 'pdf') return exportPdf(res, 'waste', 'Waste Management Report', WASTE_COLUMNS, result.items);
  res.json({ success: true, ...result });
});
const createWaste = asyncHandler(async (req, res) => {
  const record = await service.createWasteRecord(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'waste_records', entityId: record.id, newValues: record, req });
  res.status(201).json({ success: true, data: record });
});

module.exports = {
  listElectricity, createElectricity,
  listWater, createWater,
  listProductivity, recordProductivity,
  listWaste, createWaste,
};
