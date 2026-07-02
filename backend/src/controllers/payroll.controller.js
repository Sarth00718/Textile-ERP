const service = require('../services/payroll.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'employee_code', header: 'Employee Code' },
  { key: 'employee_name', header: 'Employee Name' },
  { key: 'department_name', header: 'Department' },
  { key: 'days_present', header: 'Days Present' },
  { key: 'days_on_leave', header: 'Paid Leave Days' },
  { key: 'overtime_hours', header: 'OT Hours' },
  { key: 'base_salary', header: 'Base Salary' },
  { key: 'overtime_amount', header: 'OT Amount' },
  { key: 'net_salary', header: 'Net Salary' },
];

const RUN_EXPORT_COLUMNS = [
  { key: 'period_month', header: 'Month' },
  { key: 'period_year', header: 'Year' },
  { key: 'status', header: 'Status' },
  { key: 'total_amount', header: 'Total Amount' },
  { key: 'generated_at', header: 'Generated At' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listPayrollRuns(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'payroll-runs', RUN_EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'payroll-runs', RUN_EXPORT_COLUMNS, result.items, 'Payroll Runs');
  if (req.query.format === 'pdf') return exportPdf(res, 'payroll-runs', 'Payroll Runs', RUN_EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const run = await service.getPayrollRun(req.params.id);

  if (req.query.format === 'csv') return exportCsv(res, `payroll-${run.period_month}-${run.period_year}`, EXPORT_COLUMNS, run.items);
  if (req.query.format === 'excel') return exportExcel(res, `payroll-${run.period_month}-${run.period_year}`, EXPORT_COLUMNS, run.items, 'Payroll');
  if (req.query.format === 'pdf') return exportPdf(res, `payroll-${run.period_month}-${run.period_year}`, `Payroll - ${run.period_month}/${run.period_year}`, EXPORT_COLUMNS, run.items);

  res.json({ success: true, data: run });
});

const generate = asyncHandler(async (req, res) => {
  const run = await service.generatePayrollRun(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'GENERATE', entityType: 'payroll_runs', entityId: run.id, newValues: { total: run.total_amount }, req });
  res.status(201).json({ success: true, data: run });
});

const markPaid = asyncHandler(async (req, res) => {
  const run = await service.markPayrollPaid(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'MARK_PAID', entityType: 'payroll_runs', entityId: run.id, newValues: run, req });
  res.json({ success: true, data: run });
});

module.exports = { list, getOne, generate, markPaid };
