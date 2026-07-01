import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { payrollApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, Card } from '../../components/common/Shared';
import { Input } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollPage() {
  const { can } = usePermission();
  const table = useDataTable(payrollApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear() },
  });

  function openGenerate() {
    reset({ periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear() });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await payrollApi.generate({ periodMonth: Number(values.periodMonth), periodYear: Number(values.periodYear) });
      toast.success('Payroll generated from attendance records');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate payroll');
    }
  }

  async function viewRun(row) {
    const res = await payrollApi.get(row.id);
    setViewing(res.data);
  }

  async function handleMarkPaid(id) {
    try {
      await payrollApi.markPaid(id);
      toast.success('Payroll marked as paid');
      setViewing(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark as paid');
    }
  }

  const columns = [
    { key: 'period', header: 'Period', render: (r) => `${MONTHS[r.period_month - 1]} ${r.period_year}` },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total_amount', header: 'Total Amount', render: (r) => `₹${Number(r.total_amount).toLocaleString()}` },
    { key: 'generated_at', header: 'Generated', render: (r) => r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Generate payroll runs from attendance and salary records"
        action={can('payroll', 'manage') && <Button onClick={openGenerate}><PlusIcon className="h-4 w-4" /> Generate Payroll</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} onRowClick={viewRun}
        onExport={(fmt) => payrollApi.download(fmt, {})} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Payroll">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Month (1-12)" type="number" min="1" max="12" register={register} name="periodMonth" />
            <Input label="Year" type="number" register={register} name="periodYear" />
          </div>
          <p className="mb-3 text-xs text-steel-500">
            This pulls attendance summaries for every active employee in the selected period and computes pay automatically.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Generate</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Payroll — ${MONTHS[viewing.period_month - 1]} ${viewing.period_year}` : ''} maxWidth="max-w-3xl">
        {viewing && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <StatusBadge status={viewing.status} />
              {viewing.status === 'GENERATED' && can('payroll', 'manage') && (
                <Button size="sm" onClick={() => handleMarkPaid(viewing.id)}>Mark All Paid</Button>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-steel-200 dark:border-steel-700 max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-steel-200 dark:divide-steel-700 text-sm">
                <thead className="bg-steel-50 dark:bg-steel-800 sticky top-0">
                  <tr>
                    {['Employee', 'Present', 'Leave', 'OT (hrs)', 'Base', 'OT Amt', 'Net Salary'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase text-steel-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100 dark:divide-steel-800">
                  {viewing.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.employee_name}</td>
                      <td className="px-3 py-2 tabular">{item.days_present}</td>
                      <td className="px-3 py-2 tabular">{item.paid_leave_days}</td>
                      <td className="px-3 py-2 tabular">{item.overtime_hours}</td>
                      <td className="px-3 py-2 tabular">₹{Number(item.base_salary).toLocaleString()}</td>
                      <td className="px-3 py-2 tabular">₹{Number(item.overtime_amount).toLocaleString()}</td>
                      <td className="px-3 py-2 tabular font-medium">₹{Number(item.net_salary).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
