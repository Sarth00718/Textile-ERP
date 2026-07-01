const { query } = require('../config/db');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

/* ─────────────────────────────────────────────────────────────────────────────
   PRODUCTION REPORT
   Joins daily_production_entries → production_orders → machines → employees
   Supports: search (order no / machine / operator), startDate, endDate,
             productionOrderId, format
───────────────────────────────────────────────────────────────────────────── */
async function listProductionReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const conditions = [];
  const params = [];

  if (reqQuery.search) {
    params.push(`%${reqQuery.search}%`);
    conditions.push(
      `(po.production_order_no ILIKE $${params.length} OR m.name ILIKE $${params.length} OR COALESCE(e.full_name,'') ILIKE $${params.length})`
    );
  }
  if (reqQuery.productionOrderId) {
    params.push(reqQuery.productionOrderId);
    conditions.push(`dpe.production_order_id = $${params.length}`);
  }
  if (reqQuery.startDate) {
    params.push(reqQuery.startDate);
    conditions.push(`dpe.entry_date >= $${params.length}::date`);
  }
  if (reqQuery.endDate) {
    params.push(reqQuery.endDate);
    conditions.push(`dpe.entry_date <= $${params.length}::date`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const base = `
    FROM daily_production_entries dpe
    JOIN production_orders po ON po.id = dpe.production_order_id
    JOIN machines m ON m.id = dpe.machine_id
    LEFT JOIN employees e ON e.id = dpe.operator_id
    ${where}`;

  const countRes = await query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const selectFields = `
    dpe.id,
    dpe.entry_date,
    dpe.shift_name,
    dpe.quantity_produced_meters,
    dpe.quantity_rejected_meters,
    dpe.yarn_consumed_kg,
    dpe.machine_runtime_minutes,
    dpe.remarks,
    po.production_order_no,
    m.name  AS machine_name,
    m.machine_code,
    e.full_name AS operator_name`;

  const dataQuery = `SELECT ${selectFields} ${base} ORDER BY dpe.entry_date DESC, dpe.created_at DESC`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   INVENTORY REPORT
   Full inventory_items with transaction summary (total in / total out).
   Supports: search (code/name), category, lowStockOnly, format
───────────────────────────────────────────────────────────────────────────── */
async function listInventoryReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const conditions = [];
  const params = [];

  if (reqQuery.search) {
    params.push(`%${reqQuery.search}%`);
    conditions.push(`(ii.name ILIKE $${params.length} OR ii.item_code ILIKE $${params.length})`);
  }
  if (reqQuery.category) {
    params.push(reqQuery.category);
    conditions.push(`ii.category = $${params.length}`);
  }
  if (reqQuery.lowStockOnly === 'true') {
    conditions.push(`ii.current_stock <= ii.reorder_level`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const base = `FROM inventory_items ii ${where}`;

  const countRes = await query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const selectFields = `
    ii.id,
    ii.item_code,
    ii.name,
    ii.category,
    ii.unit,
    ii.current_stock,
    ii.reorder_level,
    ii.max_stock_level,
    ii.unit_cost,
    ROUND(ii.current_stock * ii.unit_cost, 2)          AS stock_value,
    ii.warehouse_location,
    ii.is_active,
    CASE WHEN ii.current_stock <= ii.reorder_level THEN 'LOW' ELSE 'OK' END AS stock_status,
    (SELECT COALESCE(SUM(it.quantity), 0) FROM inventory_transactions it
      WHERE it.inventory_item_id = ii.id AND it.txn_type = 'IN')           AS total_received,
    (SELECT COALESCE(SUM(it.quantity), 0) FROM inventory_transactions it
      WHERE it.inventory_item_id = ii.id AND it.txn_type = 'OUT')          AS total_consumed`;

  const dataQuery = `SELECT ${selectFields} ${base} ORDER BY ii.category, ii.name`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   SALES REPORT
   sales_orders → customers, computes balance_due, startDate/endDate filters
───────────────────────────────────────────────────────────────────────────── */
async function listSalesReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const conditions = [];
  const params = [];

  if (reqQuery.search) {
    params.push(`%${reqQuery.search}%`);
    conditions.push(`(so.so_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  if (reqQuery.status) {
    params.push(reqQuery.status);
    conditions.push(`so.status = $${params.length}`);
  }
  if (reqQuery.customerId) {
    params.push(reqQuery.customerId);
    conditions.push(`so.customer_id = $${params.length}`);
  }
  if (reqQuery.startDate) {
    params.push(reqQuery.startDate);
    conditions.push(`so.order_date >= $${params.length}::date`);
  }
  if (reqQuery.endDate) {
    params.push(reqQuery.endDate);
    conditions.push(`so.order_date <= $${params.length}::date`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const base = `FROM sales_orders so JOIN customers c ON c.id = so.customer_id ${where}`;

  const countRes = await query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const selectFields = `
    so.id, so.so_number, so.order_date, so.required_by_date, so.status,
    c.name AS customer_name, c.customer_code,
    so.subtotal, so.tax_amount, so.total_amount, so.amount_paid,
    ROUND(so.total_amount - so.amount_paid, 2) AS balance_due,
    so.notes`;

  const dataQuery = `SELECT ${selectFields} ${base} ORDER BY so.order_date DESC`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   PURCHASE REPORT
   purchase_orders → suppliers, startDate/endDate filter on order_date
───────────────────────────────────────────────────────────────────────────── */
async function listPurchaseReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const conditions = [];
  const params = [];

  if (reqQuery.search) {
    params.push(`%${reqQuery.search}%`);
    conditions.push(`(po.po_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
  }
  if (reqQuery.status) {
    params.push(reqQuery.status);
    conditions.push(`po.status = $${params.length}`);
  }
  if (reqQuery.supplierId) {
    params.push(reqQuery.supplierId);
    conditions.push(`po.supplier_id = $${params.length}`);
  }
  if (reqQuery.startDate) {
    params.push(reqQuery.startDate);
    conditions.push(`po.order_date >= $${params.length}::date`);
  }
  if (reqQuery.endDate) {
    params.push(reqQuery.endDate);
    conditions.push(`po.order_date <= $${params.length}::date`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const base = `FROM purchase_orders po JOIN suppliers s ON s.id = po.supplier_id ${where}`;

  const countRes = await query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const selectFields = `
    po.id, po.po_number, po.order_date, po.expected_delivery_date, po.status,
    s.name AS supplier_name, s.supplier_code,
    po.subtotal, po.tax_amount, po.total_amount, po.notes`;

  const dataQuery = `SELECT ${selectFields} ${base} ORDER BY po.order_date DESC`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAYROLL REPORT
   payroll_runs with employee count per run
───────────────────────────────────────────────────────────────────────────── */
async function listPayrollReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const conditions = [];
  const params = [];

  if (reqQuery.status) {
    params.push(reqQuery.status);
    conditions.push(`pr.status = $${params.length}`);
  }
  if (reqQuery.periodYear) {
    params.push(parseInt(reqQuery.periodYear, 10));
    conditions.push(`pr.period_year = $${params.length}`);
  }
  if (reqQuery.periodMonth) {
    params.push(parseInt(reqQuery.periodMonth, 10));
    conditions.push(`pr.period_month = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const base = `FROM payroll_runs pr ${where}`;

  const countRes = await query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const selectFields = `
    pr.id, pr.period_month, pr.period_year, pr.status, pr.total_amount,
    pr.generated_at, pr.paid_at,
    (SELECT COUNT(*) FROM payroll_items pi WHERE pi.payroll_run_id = pr.id) AS employee_count`;

  const dataQuery = `SELECT ${selectFields} ${base} ORDER BY pr.period_year DESC, pr.period_month DESC`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   ATTENDANCE REPORT
   attendance → employees → departments
   Supports: search (name/code), status, departmentId, startDate, endDate
───────────────────────────────────────────────────────────────────────────── */
async function listAttendanceReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const conditions = [];
  const params = [];

  if (reqQuery.search) {
    params.push(`%${reqQuery.search}%`);
    conditions.push(`(e.full_name ILIKE $${params.length} OR e.employee_code ILIKE $${params.length})`);
  }
  if (reqQuery.employeeId) {
    params.push(reqQuery.employeeId);
    conditions.push(`a.employee_id = $${params.length}`);
  }
  if (reqQuery.departmentId) {
    params.push(reqQuery.departmentId);
    conditions.push(`e.department_id = $${params.length}`);
  }
  if (reqQuery.status) {
    params.push(reqQuery.status);
    conditions.push(`a.status = $${params.length}`);
  }
  if (reqQuery.startDate) {
    params.push(reqQuery.startDate);
    conditions.push(`a.attendance_date >= $${params.length}::date`);
  }
  if (reqQuery.endDate) {
    params.push(reqQuery.endDate);
    conditions.push(`a.attendance_date <= $${params.length}::date`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const base = `
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    ${where}`;

  const countRes = await query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const selectFields = `
    a.id, a.attendance_date, a.status, a.check_in, a.check_out,
    a.shift_name, a.hours_worked, a.overtime_hours, a.remarks,
    e.full_name AS employee_name, e.employee_code,
    d.name AS department_name`;

  const dataQuery = `SELECT ${selectFields} ${base} ORDER BY a.attendance_date DESC, e.full_name ASC`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   FINANCIAL REPORT
   Monthly roll-up: sales revenue/received, expenses, payroll, net profit
   Supports: startDate, endDate
───────────────────────────────────────────────────────────────────────────── */
async function listFinancialReport(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  // Default: last 12 months if no date range given
  const startDate = reqQuery.startDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10);
  const endDate   = reqQuery.endDate   || new Date().toISOString().slice(0, 10);
  const params = [startDate, endDate, startDate, endDate, startDate, endDate];

  const cte = `
    WITH sales_data AS (
      SELECT date_trunc('month', order_date)::date AS period_start,
             COALESCE(SUM(total_amount), 0)        AS sales_revenue,
             COALESCE(SUM(amount_paid),  0)        AS sales_received
      FROM   sales_orders
      WHERE  order_date BETWEEN $1::date AND $2::date
      GROUP  BY 1
    ),
    expense_data AS (
      SELECT date_trunc('month', expense_date)::date AS period_start,
             COALESCE(SUM(amount), 0)                AS expenses_total
      FROM   expenses
      WHERE  expense_date BETWEEN $3::date AND $4::date
      GROUP  BY 1
    ),
    payroll_data AS (
      SELECT make_date(period_year::int, period_month::int, 1) AS period_start,
             COALESCE(SUM(total_amount), 0)                    AS payroll_total
      FROM   payroll_runs
      WHERE  status = 'PAID'
        AND  make_date(period_year::int, period_month::int, 1) BETWEEN $5::date AND $6::date
      GROUP  BY 1
    ),
    all_periods AS (
      SELECT period_start FROM sales_data
      UNION
      SELECT period_start FROM expense_data
      UNION
      SELECT period_start FROM payroll_data
    )`;

  const countResult = await query(`${cte} SELECT COUNT(*) AS count FROM all_periods`, params);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  const dataQuery = `${cte}
    SELECT
      p.period_start,
      to_char(p.period_start, 'Mon YYYY')                           AS period_label,
      COALESCE(sd.sales_revenue,   0)                               AS sales_revenue,
      COALESCE(sd.sales_received,  0)                               AS sales_received,
      COALESCE(sd.sales_revenue, 0) - COALESCE(sd.sales_received, 0) AS sales_outstanding,
      COALESCE(ed.expenses_total,  0)                               AS expenses_total,
      COALESCE(pd.payroll_total,   0)                               AS payroll_total,
      COALESCE(sd.sales_revenue, 0)
        - COALESCE(ed.expenses_total, 0)
        - COALESCE(pd.payroll_total,  0)                            AS net_profit
    FROM   all_periods p
    LEFT JOIN sales_data   sd ON sd.period_start = p.period_start
    LEFT JOIN expense_data ed ON ed.period_start = p.period_start
    LEFT JOIN payroll_data pd ON pd.period_start = p.period_start
    ORDER  BY p.period_start DESC`;

  if (reqQuery.format) {
    const { rows } = await query(dataQuery, params);
    return { items: rows };
  }

  params.push(limit, offset);
  const { rows } = await query(`${dataQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

module.exports = {
  listProductionReport,
  listInventoryReport,
  listSalesReport,
  listPurchaseReport,
  listPayrollReport,
  listAttendanceReport,
  listFinancialReport,
};