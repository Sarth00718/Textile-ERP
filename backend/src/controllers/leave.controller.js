const service = require('../services/leave.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'employee_code', header: 'Employee Code' },
  { key: 'employee_name', header: 'Employee Name' },
  { key: 'leave_type', header: 'Leave Type' },
  { key: 'start_date', header: 'Start Date' },
  { key: 'end_date', header: 'End Date' },
  { key: 'total_days', header: 'Total Days' },
  { key: 'status', header: 'Status' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listLeaveRequests(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'leave-requests', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'leave-requests', EXPORT_COLUMNS, result.items, 'Leave Requests');
  if (req.query.format === 'pdf') return exportPdf(res, 'leave-requests', 'Leave Requests', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const lr = await service.getLeaveRequest(req.params.id);
  res.json({ success: true, data: lr });
});

const create = asyncHandler(async (req, res) => {
  const lr = await service.createLeaveRequest(req.body);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'leave_requests', entityId: lr.id, newValues: lr, req });
  res.status(201).json({ success: true, data: lr });
});

const approve = asyncHandler(async (req, res) => {
  const lr = await service.approveLeaveRequest(req.params.id, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'APPROVE', entityType: 'leave_requests', entityId: lr.id, newValues: lr, req });
  res.json({ success: true, data: lr });
});

const reject = asyncHandler(async (req, res) => {
  const lr = await service.rejectLeaveRequest(req.params.id, req.user.id, req.body.rejectionReason);
  await recordAudit({ userId: req.user.id, action: 'REJECT', entityType: 'leave_requests', entityId: lr.id, newValues: lr, req });
  res.json({ success: true, data: lr });
});

const cancel = asyncHandler(async (req, res) => {
  const lr = await service.cancelLeaveRequest(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'CANCEL', entityType: 'leave_requests', entityId: lr.id, newValues: lr, req });
  res.json({ success: true, data: lr });
});

module.exports = { list, getOne, create, approve, reject, cancel };
