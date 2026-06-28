const service = require('../services/auditLog.service');
const { asyncHandler } = require('../utils/apiError');
const { exportCsv, exportExcel } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'created_at', header: 'Timestamp' },
  { key: 'user_name', header: 'User' },
  { key: 'action', header: 'Action' },
  { key: 'entity_type', header: 'Entity Type' },
  { key: 'entity_id', header: 'Entity ID' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listAuditLogs(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'audit-logs', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'audit-logs', EXPORT_COLUMNS, result.items, 'Audit Logs');
  res.json({ success: true, ...result });
});

module.exports = { list };
