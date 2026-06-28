const service = require('../services/employee.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'employee_code', header: 'Employee Code' },
  { key: 'full_name', header: 'Full Name' },
  { key: 'department_name', header: 'Department' },
  { key: 'designation', header: 'Designation' },
  { key: 'date_of_joining', header: 'Date of Joining' },
  { key: 'employment_status', header: 'Status' },
  { key: 'phone', header: 'Phone' },
  { key: 'base_salary', header: 'Base Salary' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listEmployees(req.query);

  if (req.query.format === 'csv') return exportCsv(res, 'employees', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'employees', EXPORT_COLUMNS, result.items, 'Employees');
  if (req.query.format === 'pdf') return exportPdf(res, 'employees', 'Employee List', EXPORT_COLUMNS, result.items);

  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const emp = await service.getEmployee(req.params.id);
  res.json({ success: true, data: emp });
});

const create = asyncHandler(async (req, res) => {
  const emp = await service.createEmployee(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'employees', entityId: emp.id, newValues: emp, req });
  res.status(201).json({ success: true, data: emp });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getEmployee(req.params.id);
  const emp = await service.updateEmployee(req.params.id, req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'employees', entityId: emp.id, oldValues: before, newValues: emp, req });
  res.json({ success: true, data: emp });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getEmployee(req.params.id);
  await service.deleteEmployee(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'employees', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Employee deleted successfully' });
});

module.exports = { list, getOne, create, update, remove };
