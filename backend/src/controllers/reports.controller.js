const { asyncHandler } = require('../utils/apiError');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');
const service = require('../services/reports.service');

const PRODUCTION_COLUMNS = [
  { key: 'entry_date', header: 'Date' },
  { key: 'production_order_no', header: 'Production Order' },
  { key: 'machine_name', header: 'Machine' },
  { key: 'machine_code', header: 'Machine Code' },
  { key: 'shift_name', header: 'Shift' },
  { key: 'operator_name', header: 'Operator' },
  { key: 'quantity_produced_meters', header: 'Produced (m)' },
  { key: 'quantity_rejected_meters', header: 'Rejected (m)' },
  { key: 'machine_runtime_minutes', header: 'Runtime (min)' },
];

const INVENTORY_COLUMNS = [
  { key: 'item_code', header: 'Item Code' },
  { key: 'name', header: 'Item Name' },
  { key: 'category', header: 'Category' },
  { key: 'unit', header: 'Unit' },
  { key: 'current_stock', header: 'Current Stock' },
  { key: 'reorder_level', header: 'Reorder Level' },
  { key: 'max_stock_level', header: 'Max Stock' },
  { key: 'unit_cost', header: 'Unit Cost (₹)' },
  { key: 'stock_value', header: 'Stock Value (₹)' },
  { key: 'stock_status', header: 'Stock Status' },
  { key: 'total_received', header: 'Total Received' },
  { key: 'total_consumed', header: 'Total Consumed' },
  { key: 'warehouse_location', header: 'Location' },
  { key: 'is_active', header: 'Active' },
];

const SALES_COLUMNS = [
  { key: 'so_number', header: 'SO No' },
  { key: 'customer_name', header: 'Customer' },
  { key: 'status', header: 'Status' },
  { key: 'order_date', header: 'Order Date' },
  { key: 'required_by_date', header: 'Required By' },
  { key: 'subtotal', header: 'Subtotal (₹)' },
  { key: 'tax_amount', header: 'Tax (₹)' },
  { key: 'total_amount', header: 'Total (₹)' },
  { key: 'amount_paid', header: 'Paid (₹)' },
  { key: 'balance_due', header: 'Balance Due (₹)' },
];

const PURCHASE_COLUMNS = [
  { key: 'po_number', header: 'PO No' },
  { key: 'supplier_name', header: 'Supplier' },
  { key: 'status', header: 'Status' },
  { key: 'order_date', header: 'Order Date' },
  { key: 'expected_delivery_date', header: 'Expected Delivery' },
  { key: 'subtotal', header: 'Subtotal' },
  { key: 'tax_amount', header: 'Tax' },
  { key: 'total_amount', header: 'Total' },
];

const PAYROLL_COLUMNS = [
  { key: 'period_month', header: 'Month' },
  { key: 'period_year', header: 'Year' },
  { key: 'status', header: 'Status' },
  { key: 'employee_count', header: 'Employees' },
  { key: 'total_amount', header: 'Total Amount (₹)' },
  { key: 'generated_at', header: 'Generated At' },
  { key: 'paid_at', header: 'Paid At' },
];

const ATTENDANCE_COLUMNS = [
  { key: 'attendance_date', header: 'Date' },
  { key: 'employee_code', header: 'Employee Code' },
  { key: 'employee_name', header: 'Employee Name' },
  { key: 'department_name', header: 'Department' },
  { key: 'status', header: 'Status' },
  { key: 'check_in', header: 'Check In' },
  { key: 'check_out', header: 'Check Out' },
  { key: 'hours_worked', header: 'Hours Worked' },
  { key: 'overtime_hours', header: 'Overtime' },
  { key: 'remarks', header: 'Remarks' },
];

const FINANCIAL_COLUMNS = [
  { key: 'period_label', header: 'Period' },
  { key: 'sales_revenue', header: 'Sales Revenue' },
  { key: 'sales_received', header: 'Sales Received' },
  { key: 'sales_outstanding', header: 'Sales Outstanding' },
  { key: 'expenses_total', header: 'Expenses' },
  { key: 'payroll_total', header: 'Payroll' },
  { key: 'net_profit', header: 'Net Profit' },
];

const REPORTS = {
  production: {
    title: 'Production Report',
    filename: 'production-report',
    sheet: 'Production',
    columns: PRODUCTION_COLUMNS,
    load: service.listProductionReport,
  },
  inventory: {
    title: 'Inventory Report',
    filename: 'inventory-report',
    sheet: 'Inventory',
    columns: INVENTORY_COLUMNS,
    load: service.listInventoryReport,
  },
  sales: {
    title: 'Sales Report',
    filename: 'sales-report',
    sheet: 'Sales',
    columns: SALES_COLUMNS,
    load: service.listSalesReport,
  },
  purchase: {
    title: 'Purchase Report',
    filename: 'purchase-report',
    sheet: 'Purchase',
    columns: PURCHASE_COLUMNS,
    load: service.listPurchaseReport,
  },
  payroll: {
    title: 'Payroll Report',
    filename: 'payroll-report',
    sheet: 'Payroll',
    columns: PAYROLL_COLUMNS,
    load: service.listPayrollReport,
  },
  attendance: {
    title: 'Attendance Report',
    filename: 'attendance-report',
    sheet: 'Attendance',
    columns: ATTENDANCE_COLUMNS,
    load: service.listAttendanceReport,
  },
  financial: {
    title: 'Financial Report',
    filename: 'financial-report',
    sheet: 'Financial',
    columns: FINANCIAL_COLUMNS,
    load: service.listFinancialReport,
  },
};

function buildExportRows(rows, key) {
  if (key === 'sales') {
    return rows.map((row) => ({
      ...row,
      balance_due: row.balance_due ?? (Number(row.total_amount || 0) - Number(row.amount_paid || 0)),
    }));
  }
  return rows;
}

function sendExport(res, key, rows) {
  const def = REPORTS[key];
  if (!def) return false;
  const exportRows = buildExportRows(rows, key);
  const filename = def.filename;
  if (res.req.query.format === 'csv') return exportCsv(res, filename, def.columns, exportRows);
  if (res.req.query.format === 'excel') return exportExcel(res, filename, def.columns, exportRows, def.sheet);
  if (res.req.query.format === 'pdf') return exportPdf(res, filename, def.title, def.columns, exportRows);
  return false;
}

function createListHandler(key) {
  return asyncHandler(async (req, res) => {
    const def = REPORTS[key];
    const result = await def.load(req.query);
    if (req.query.format) {
      const rows = buildExportRows(result.items || [], key);
      if (req.query.format === 'csv') return exportCsv(res, def.filename, def.columns, rows);
      if (req.query.format === 'excel') return exportExcel(res, def.filename, def.columns, rows, def.sheet);
      if (req.query.format === 'pdf') return exportPdf(res, def.filename, def.title, def.columns, rows);
    }
    if (key === 'sales') {
      result.items = buildExportRows(result.items || [], key);
    }
    res.json({ success: true, ...result });
  });
}

const listProduction = createListHandler('production');
const listInventory = createListHandler('inventory');
const listSales = createListHandler('sales');
const listPurchase = createListHandler('purchase');
const listPayroll = createListHandler('payroll');
const listAttendance = createListHandler('attendance');
const listFinancial = createListHandler('financial');

module.exports = {
  listProduction,
  listInventory,
  listSales,
  listPurchase,
  listPayroll,
  listAttendance,
  listFinancial,
};