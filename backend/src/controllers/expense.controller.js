const service = require('../services/expense.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'expense_no', header: 'Expense No' },
  { key: 'category', header: 'Category' },
  { key: 'description', header: 'Description' },
  { key: 'amount', header: 'Amount' },
  { key: 'expense_date', header: 'Date' },
  { key: 'department_name', header: 'Department' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listExpenses(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'expenses', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'expenses', EXPORT_COLUMNS, result.items, 'Expenses');
  if (req.query.format === 'pdf') return exportPdf(res, 'expenses', 'Expense Report', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const summary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await service.getExpenseSummary(startDate, endDate);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const expense = await service.getExpense(req.params.id);
  res.json({ success: true, data: expense });
});

const create = asyncHandler(async (req, res) => {
  const expense = await service.createExpense(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'expenses', entityId: expense.id, newValues: expense, req });
  res.status(201).json({ success: true, data: expense });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getExpense(req.params.id);
  const expense = await service.updateExpense(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'expenses', entityId: expense.id, oldValues: before, newValues: expense, req });
  res.json({ success: true, data: expense });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getExpense(req.params.id);
  await service.deleteExpense(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'expenses', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Expense deleted successfully' });
});

module.exports = { list, summary, getOne, create, update, remove };
