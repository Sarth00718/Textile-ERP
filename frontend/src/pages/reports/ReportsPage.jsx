import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { reportsApi } from '../../api/services';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import { Card, PageHeader } from '../../components/common/Shared';

const REPORT_ORDER = ['production', 'inventory', 'sales', 'purchase', 'payroll', 'attendance', 'financial'];

const REPORT_TYPES = {
  production: {
    label: 'Production',
    title: 'Production Report',
    description: 'Track daily production output, machine usage, and operator activity.',
    searchPlaceholder: 'Search order, machine, or operator',
    columns: [
      { key: 'entry_date', header: 'Date' },
      { key: 'production_order_no', header: 'Order No' },
      { key: 'machine_name', header: 'Machine' },
      { key: 'shift_name', header: 'Shift' },
      { key: 'operator_name', header: 'Operator', render: (row) => row.operator_name || '—' },
      { key: 'quantity_produced_meters', header: 'Produced (m)' },
      { key: 'quantity_rejected_meters', header: 'Rejected (m)' },
      { key: 'machine_runtime_minutes', header: 'Runtime (min)' },
    ],
    initialFilters: { startDate: '', endDate: '', productionOrderId: '' },
    renderFilters: (table) => (
      <>
        <input
          type="date"
          value={table.filters.startDate || ''}
          onChange={(e) => table.updateFilters({ startDate: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
        <input
          type="date"
          value={table.filters.endDate || ''}
          onChange={(e) => table.updateFilters({ endDate: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
      </>
    ),
  },
  inventory: {
    label: 'Inventory',
    title: 'Inventory Report',
    description: 'Review stock levels, reorder thresholds, valuation, and consumption summary.',
    searchPlaceholder: 'Search item code or name',
    columns: [
      { key: 'item_code', header: 'Code' },
      { key: 'name', header: 'Item Name' },
      { key: 'category', header: 'Category', render: (row) => (row.category || '').replace(/_/g, ' ') },
      { key: 'unit', header: 'Unit' },
      { key: 'current_stock', header: 'Stock', render: (row) => Number(row.current_stock || 0).toLocaleString() },
      { key: 'reorder_level', header: 'Reorder', render: (row) => Number(row.reorder_level || 0).toLocaleString() },
      { key: 'stock_status', header: 'Status', render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.stock_status === 'LOW' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
          {row.stock_status || 'OK'}
        </span>
      )},
      { key: 'unit_cost', header: 'Unit Cost', render: (row) => `₹${Number(row.unit_cost || 0).toLocaleString()}` },
      { key: 'stock_value', header: 'Stock Value', render: (row) => `₹${Number(row.stock_value || 0).toLocaleString()}` },
      { key: 'total_received', header: 'Total In', render: (row) => Number(row.total_received || 0).toLocaleString() },
      { key: 'total_consumed', header: 'Total Out', render: (row) => Number(row.total_consumed || 0).toLocaleString() },
      { key: 'warehouse_location', header: 'Location', render: (row) => row.warehouse_location || '—' },
    ],
    initialFilters: { category: '', lowStockOnly: '' },
    renderFilters: (table) => (
      <>
        <select
          value={table.filters.category || ''}
          onChange={(e) => table.updateFilters({ category: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {['RAW_MATERIAL', 'YARN', 'CHEMICAL', 'SPARE_PART', 'PACKING_MATERIAL', 'FINISHED_GOODS', 'OTHER'].map((value) => (
            <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={table.filters.lowStockOnly || ''}
          onChange={(e) => table.updateFilters({ lowStockOnly: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        >
          <option value="">All stock levels</option>
          <option value="true">Low stock only</option>
        </select>
      </>
    ),
  },
  sales: {
    label: 'Sales',
    title: 'Sales Report',
    description: 'Track order progress, receivables, and customer throughput.',
    searchPlaceholder: 'Search sales order or customer',
    columns: [
      { key: 'so_number', header: 'SO No' },
      { key: 'customer_name', header: 'Customer' },
      { key: 'order_date', header: 'Order Date' },
      { key: 'status', header: 'Status', render: (row) => (row.status || '').replace(/_/g, ' ') },
      { key: 'total_amount', header: 'Total', render: (row) => `₹${Number(row.total_amount || 0).toLocaleString()}` },
      { key: 'amount_paid', header: 'Paid', render: (row) => `₹${Number(row.amount_paid || 0).toLocaleString()}` },
      { key: 'balance_due', header: 'Balance Due', render: (row) => (
        <span className={Number(row.balance_due || 0) > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
          ₹{Number(row.balance_due || 0).toLocaleString()}
        </span>
      )},
    ],
    initialFilters: { status: '', startDate: '', endDate: '' },
    renderFilters: (table) => (
      <>
        <select
          value={table.filters.status || ''}
          onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'CANCELLED'].map((value) => (
            <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input type="date" value={table.filters.startDate || ''} onChange={(e) => table.updateFilters({ startDate: e.target.value || undefined })} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm" />
        <input type="date" value={table.filters.endDate || ''} onChange={(e) => table.updateFilters({ endDate: e.target.value || undefined })} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm" />
      </>
    ),
  },
  purchase: {
    label: 'Purchase',
    title: 'Purchase Report',
    description: 'Review procurement cycle, receiving status, and supplier activity.',
    searchPlaceholder: 'Search purchase order or supplier',
    columns: [
      { key: 'po_number', header: 'PO No' },
      { key: 'supplier_name', header: 'Supplier' },
      { key: 'order_date', header: 'Order Date' },
      { key: 'expected_delivery_date', header: 'Expected Delivery', render: (row) => row.expected_delivery_date || '—' },
      { key: 'status', header: 'Status', render: (row) => (row.status || '').replace(/_/g, ' ') },
      { key: 'subtotal', header: 'Subtotal', render: (row) => `₹${Number(row.subtotal || 0).toLocaleString()}` },
      { key: 'tax_amount', header: 'Tax', render: (row) => `₹${Number(row.tax_amount || 0).toLocaleString()}` },
      { key: 'total_amount', header: 'Total', render: (row) => `₹${Number(row.total_amount || 0).toLocaleString()}` },
    ],
    initialFilters: { status: '', startDate: '', endDate: '' },
    renderFilters: (table) => (
      <>
        <select
          value={table.filters.status || ''}
          onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((value) => (
            <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input type="date" value={table.filters.startDate || ''} onChange={(e) => table.updateFilters({ startDate: e.target.value || undefined })} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm" />
        <input type="date" value={table.filters.endDate || ''} onChange={(e) => table.updateFilters({ endDate: e.target.value || undefined })} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm" />
      </>
    ),
  },
  payroll: {
    label: 'Payroll',
    title: 'Payroll Report',
    description: 'Analyze payroll runs by period, status, and payout totals.',
    columns: [
      { key: 'period_month', header: 'Month' },
      { key: 'period_year', header: 'Year' },
      { key: 'status', header: 'Status' },
      { key: 'employee_count', header: 'Employees' },
      { key: 'total_amount', header: 'Total Amount', render: (row) => `₹${Number(row.total_amount || 0).toLocaleString()}` },
      { key: 'generated_at', header: 'Generated', render: (row) => (row.generated_at ? new Date(row.generated_at).toLocaleDateString() : '—') },
      { key: 'paid_at', header: 'Paid', render: (row) => (row.paid_at ? new Date(row.paid_at).toLocaleDateString() : '—') },
    ],
    initialFilters: { status: '', periodMonth: '', periodYear: '' },
    renderFilters: (table) => (
      <>
        <select
          value={table.filters.status || ''}
          onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'GENERATED', 'PAID'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <input
          type="number"
          placeholder="Year"
          value={table.filters.periodYear || ''}
          onChange={(e) => table.updateFilters({ periodYear: e.target.value || undefined })}
          className="w-24 rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
        <input
          type="number"
          min="1"
          max="12"
          placeholder="Month"
          value={table.filters.periodMonth || ''}
          onChange={(e) => table.updateFilters({ periodMonth: e.target.value || undefined })}
          className="w-24 rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
      </>
    ),
  },
  attendance: {
    label: 'Attendance',
    title: 'Attendance Report',
    description: 'Review attendance status, shift timing, and overtime by employee.',
    searchPlaceholder: 'Search employee code or name',
    columns: [
      { key: 'attendance_date', header: 'Date' },
      { key: 'employee_code', header: 'Employee Code' },
      { key: 'employee_name', header: 'Employee Name' },
      { key: 'department_name', header: 'Department' },
      { key: 'status', header: 'Status' },
      { key: 'check_in', header: 'Check In' },
      { key: 'check_out', header: 'Check Out' },
      { key: 'hours_worked', header: 'Hours Worked' },
      { key: 'overtime_hours', header: 'Overtime' },
    ],
    initialFilters: { status: '', startDate: '', endDate: '' },
    renderFilters: (table) => (
      <>
        <select
          value={table.filters.status || ''}
          onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'].map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}
        </select>
        <input
          type="date"
          value={table.filters.startDate || ''}
          onChange={(e) => table.updateFilters({ startDate: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
        <input
          type="date"
          value={table.filters.endDate || ''}
          onChange={(e) => table.updateFilters({ endDate: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
      </>
    ),
  },
  financial: {
    label: 'Financial',
    title: 'Financial Report',
    description: 'Compare monthly revenue, expenses, payroll, and net profit.',
    columns: [
      { key: 'period_label', header: 'Period' },
      { key: 'sales_revenue', header: 'Sales Revenue', render: (row) => `₹${Number(row.sales_revenue || 0).toLocaleString()}` },
      { key: 'sales_received', header: 'Received', render: (row) => `₹${Number(row.sales_received || 0).toLocaleString()}` },
      { key: 'sales_outstanding', header: 'Outstanding', render: (row) => (
        <span className={Number(row.sales_outstanding || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
          ₹{Number(row.sales_outstanding || 0).toLocaleString()}
        </span>
      )},
      { key: 'expenses_total', header: 'Expenses', render: (row) => `₹${Number(row.expenses_total || 0).toLocaleString()}` },
      { key: 'payroll_total', header: 'Payroll', render: (row) => `₹${Number(row.payroll_total || 0).toLocaleString()}` },
      { key: 'net_profit', header: 'Net Profit', render: (row) => (
        <span className={Number(row.net_profit || 0) >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
          ₹{Number(row.net_profit || 0).toLocaleString()}
        </span>
      )},
    ],
    initialFilters: { startDate: '', endDate: '' },
    renderFilters: (table) => (
      <>
        <input
          type="date"
          value={table.filters.startDate || ''}
          onChange={(e) => table.updateFilters({ startDate: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
        <input
          type="date"
          value={table.filters.endDate || ''}
          onChange={(e) => table.updateFilters({ endDate: e.target.value || undefined })}
          className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
        />
      </>
    ),
  },
};

function ReportsView({ reportType }) {
  const config = REPORT_TYPES[reportType];
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() => ({ ...config.initialFilters }));
  const debounceRef = useRef(null);

  const load = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Strip empty-string values so they don't pollute query params
      const clean = {};
      const merged = { page, pageSize: 20, ...filters, search: search || undefined, ...overrideParams };
      Object.entries(merged).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null) clean[k] = v;
      });
      const res = await reportsApi.list(reportType, clean);
      setItems(res.items || []);
      setMeta(res.meta || null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load report';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, page, search, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [reportType, page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(value) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load({ search: value, page: 1 });
    }, 350);
  }

  function updateFilters(next) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...next }));
  }

  async function handleExport(format) {
    try {
      const clean = {};
      Object.entries({ ...filters, search: search || undefined }).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null) clean[k] = v;
      });
      await reportsApi.download(reportType, clean, format);
    } catch (err) {
      alert('Export failed: ' + (err?.message || 'Unknown error'));
    }
  }

  // Simulated table object for renderFilters (matches useDataTable API)
  const table = { items, meta, loading, error, page, search, filters, setPage, handleSearch, updateFilters, reload: load };

  return (
    <div>
      <PageHeader title={config.title} description={config.description} breadcrumb="Reports" />

      <Card className="mb-4 p-2">
        <div className="flex flex-wrap gap-2">
          {REPORT_ORDER.map((type) => {
            const item = REPORT_TYPES[type];
            const active = type === reportType;
            return (
              <Link
                key={type}
                to={`/reports/${type}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-steel-900 text-white dark:bg-amber-500 dark:text-steel-950'
                    : 'bg-steel-100 text-steel-700 hover:bg-steel-200 dark:bg-steel-800 dark:text-steel-200 dark:hover:bg-steel-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      <DataTable
        columns={config.columns}
        rows={items}
        meta={meta}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSearch={config.searchPlaceholder ? handleSearch : undefined}
        searchPlaceholder={config.searchPlaceholder}
        filters={config.renderFilters ? config.renderFilters(table) : undefined}
        onExport={handleExport}
        emptyMessage={`No ${config.label.toLowerCase()} records match the selected filters.`}
      />
    </div>
  );
}

export default function ReportsPage() {
  const { reportType } = useParams();
  const { can } = usePermission();

  if (!can('reports', 'view')) {
    return <Navigate to="/403" replace />;
  }

  const resolvedType = reportType && REPORT_TYPES[reportType] ? reportType : 'production';
  if (reportType && !REPORT_TYPES[reportType]) {
    return <Navigate to="/reports" replace />;
  }

  return <ReportsView key={resolvedType} reportType={resolvedType} />;
}