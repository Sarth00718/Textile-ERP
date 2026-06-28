const service = require('../services/attendance.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'employee_code', header: 'Employee Code' },
  { key: 'employee_name', header: 'Employee Name' },
  { key: 'attendance_date', header: 'Date' },
  { key: 'status', header: 'Status' },
  { key: 'check_in', header: 'Check In' },
  { key: 'check_out', header: 'Check Out' },
  { key: 'hours_worked', header: 'Hours Worked' },
  { key: 'overtime_hours', header: 'Overtime Hours' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listAttendance(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'attendance', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'attendance', EXPORT_COLUMNS, result.items, 'Attendance');
  if (req.query.format === 'pdf') return exportPdf(res, 'attendance', 'Attendance Report', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const record = await service.getAttendance(req.params.id);
  res.json({ success: true, data: record });
});

const mark = asyncHandler(async (req, res) => {
  const record = await service.markAttendance(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'attendance', entityId: record.id, newValues: record, req });
  res.status(201).json({ success: true, data: record });
});

const bulkMark = asyncHandler(async (req, res) => {
  const records = await service.bulkMarkAttendance(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'BULK_CREATE', entityType: 'attendance', newValues: { count: records.length }, req });
  res.status(201).json({ success: true, data: records });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getAttendance(req.params.id);
  const record = await service.updateAttendance(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'attendance', entityId: record.id, oldValues: before, newValues: record, req });
  res.json({ success: true, data: record });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getAttendance(req.params.id);
  await service.deleteAttendance(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'attendance', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Attendance record deleted successfully' });
});

module.exports = { list, getOne, mark, bulkMark, update, remove };
