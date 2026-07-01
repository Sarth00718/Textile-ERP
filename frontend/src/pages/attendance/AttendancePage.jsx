import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { attendanceApi, employeeApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' }, { value: 'ABSENT', label: 'Absent' },
  { value: 'HALF_DAY', label: 'Half Day' }, { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'HOLIDAY', label: 'Holiday' },
];

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  attendanceDate: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  overtimeHours: z.coerce.number().nonnegative().optional(),
});

export default function AttendancePage() {
  const { can } = usePermission();
  const table = useDataTable(attendanceApi.list);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { attendanceDate: new Date().toISOString().slice(0, 10), status: 'PRESENT' },
  });

  useEffect(() => {
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
  }, []);

  function openMark() {
    reset({ attendanceDate: new Date().toISOString().slice(0, 10), status: 'PRESENT' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await attendanceApi.create(values);
      toast.success('Attendance recorded');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record attendance');
    }
  }

  const columns = [
    { key: 'attendance_date', header: 'Date' },
    { key: 'employee_code', header: 'Code' },
    { key: 'employee_name', header: 'Employee' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'check_in', header: 'Check In', render: (r) => r.check_in || '—' },
    { key: 'check_out', header: 'Check Out', render: (r) => r.check_out || '—' },
    { key: 'overtime_hours', header: 'OT (hrs)', render: (r) => r.overtime_hours || 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Daily attendance records across the factory"
        action={can('attendance', 'manage') && <Button onClick={openMark}><PlusIcon className="h-4 w-4" /> Mark Attendance</Button>}
      />

      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        onSearch={undefined}
        filters={
          <select
            onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        }
        onExport={(fmt) => attendanceApi.download(fmt, { ...table.filters })}
        emptyMessage="No attendance records for the selected filters."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Mark Attendance">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Employee" required register={register} name="employeeId" placeholder="Select employee" error={errors.employeeId}
            options={employees.map((e) => ({ value: e.id, label: `${e.employee_code} — ${e.full_name}` }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Date" type="date" required register={register} name="attendanceDate" error={errors.attendanceDate} />
            <Select label="Status" required register={register} name="status" options={STATUS_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Check In" type="time" register={register} name="checkIn" />
            <Input label="Check Out" type="time" register={register} name="checkOut" />
          </div>
          <Input label="Overtime Hours" type="number" step="0.5" register={register} name="overtimeHours" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
