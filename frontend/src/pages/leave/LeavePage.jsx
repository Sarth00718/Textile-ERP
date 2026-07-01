import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { leaveApi, employeeApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Select, Textarea } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick' }, { value: 'CASUAL', label: 'Casual' },
  { value: 'EARNED', label: 'Earned' }, { value: 'UNPAID', label: 'Unpaid' },
  { value: 'MATERNITY', label: 'Maternity' }, { value: 'PATERNITY', label: 'Paternity' },
];

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  leaveType: z.enum(['SICK', 'CASUAL', 'EARNED', 'UNPAID', 'MATERNITY', 'PATERNITY']),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  reason: z.string().optional(),
});

export default function LeavePage() {
  const { can } = usePermission();
  const table = useDataTable(leaveApi.list);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
  }, []);

  function openCreate() {
    reset({ leaveType: 'CASUAL' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await leaveApi.create(values);
      toast.success('Leave request submitted');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit leave request');
    }
  }

  async function handleApprove(row) {
    try {
      await leaveApi.approve(row.id);
      toast.success('Leave approved — attendance updated automatically');
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve leave');
    }
  }

  async function confirmReject() {
    try {
      await leaveApi.reject(rejecting.id, rejectReason);
      toast.success('Leave rejected');
      setRejecting(null);
      setRejectReason('');
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reject leave');
    }
  }

  const columns = [
    { key: 'employee_name', header: 'Employee' },
    { key: 'leave_type', header: 'Type' },
    { key: 'start_date', header: 'From' },
    { key: 'end_date', header: 'To' },
    { key: 'total_days', header: 'Days' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      render: (r) => r.status === 'PENDING' && can('leave', 'manage') && (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleApprove(r); }} className="rounded p-1 hover:bg-green-100 dark:hover:bg-green-900/30" title="Approve">
            <CheckIcon className="h-4 w-4 text-signal-run" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setRejecting(r); }} className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/30" title="Reject">
            <XMarkIcon className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Leave requests and approvals — approving a request automatically marks attendance"
        action={<Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Request Leave</Button>}
      />

      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        filters={
          <select
            onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        }
        onExport={(fmt) => leaveApi.download(fmt, { ...table.filters })}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Leave">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Employee" required register={register} name="employeeId" placeholder="Select employee" error={errors.employeeId}
            options={employees.map((e) => ({ value: e.id, label: `${e.employee_code} — ${e.full_name}` }))} />
          <Select label="Leave Type" required register={register} name="leaveType" options={LEAVE_TYPES} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="From" type="date" required register={register} name="startDate" error={errors.startDate} />
            <Input label="To" type="date" required register={register} name="endDate" error={errors.endDate} />
          </div>
          <Textarea label="Reason" register={register} name="reason" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!rejecting}
        title="Reject leave request?"
        message={
          <div className="mt-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              className="w-full rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        }
        onConfirm={confirmReject}
        onCancel={() => { setRejecting(null); setRejectReason(''); }}
        confirmLabel="Reject"
        danger
      />
    </div>
  );
}
