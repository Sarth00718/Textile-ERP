const service = require('../services/rawMaterialConsumption.service');
const { asyncHandler } = require('../utils/apiError');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'production_order_no', header: 'Production Order' },
  { key: 'item_name', header: 'Item' },
  { key: 'quantity_consumed', header: 'Quantity Consumed' },
  { key: 'unit', header: 'Unit' },
  { key: 'consumption_date', header: 'Date' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listConsumptions(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'raw-material-consumption', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'raw-material-consumption', EXPORT_COLUMNS, result.items, 'RM Consumption');
  if (req.query.format === 'pdf') return exportPdf(res, 'raw-material-consumption', 'Raw Material Consumption', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

module.exports = { list };
