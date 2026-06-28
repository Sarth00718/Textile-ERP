import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { machineApi, departmentApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog, Card } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  machineCode: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Required'),
  machineType: z.string().min(1, 'Required'),
  manufacturer: z.string().optional(),
  departmentId: z.string().optional(),
  ratedSpeed: z.coerce.number().optional(),
  location: z.string().optional(),
});

export default function MachinesPage() {
  const { can } = usePermission();
  const table = useDataTable(machineApi.list);
  const [departments, setDepartments] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    departmentApi.list({ pageSize: 100 }).then((res) => setDepartments(res.items || []));
    machineApi.utilization().then((res) => setUtilization(res.data));
  }, []);

  function openCreate() {
    setEditing(null);
    reset({ machineCode: '', name: '', machineType: '' });
    setModalOpen(true);
  }
  function openEdit(row) {
    setEditing(row);
    reset({
      machineCode: row.machine_code, name: row.name, machineType: row.machine_type,
      manufacturer: row.manufacturer || '', departmentId: row.department_id || '',
      ratedSpeed: row.rated_speed || '', location: row.location || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await machineApi.update(editing.id, values); toast.success('Machine updated'); }
      else { await machineApi.create(values); toast.success('Machine added'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await machineApi.remove(deleting.id);
      toast.success('Machine deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete machine');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'machine_code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'machine_type', header: 'Type' },
    { key: 'department_name', header: 'Department', render: (r) => r.department_name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'current_operator_name', header: 'Operator', render: (r) => r.current_operator_name || '—' },
    {
      key: 'actions', header: '',
      render: (r) => can('machines', 'manage') && (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="rounded p-1 hover:bg-steel-100 dark:hover:bg-steel-700">
            <PencilIcon className="h-4 w-4 text-steel-500" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleting(r); }} className="rounded p-1 hover:bg-steel-100 dark:hover:bg-steel-700">
            <TrashIcon className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Machines"
        description="Machine registry and live status"
        action={can('machines', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Machine</Button>}
      />

      {utilization && (
        <div className="mb-4 grid grid-cols-5 gap-3">
          {[['Running', utilization.counts.RUNNING, 'signal-run'], ['Idle', utilization.counts.IDLE, 'amber-500'],
            ['Breakdown', utilization.counts.BREAKDOWN, 'signal-down'], ['Maintenance', utilization.counts.MAINTENANCE, 'blue-500'],
            ['Offline', utilization.counts.OFFLINE, 'steel-400']].map(([label, val]) => (
            <Card key={label} className="text-center">
              <div className="text-xs uppercase text-steel-400">{label}</div>
              <div className="text-lg font-semibold tabular text-steel-900 dark:text-steel-50">{val}</div>
            </Card>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        onSearch={table.handleSearch}
        searchPlaceholder="Search machines…"
        filters={
          <select onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="RUNNING">Running</option><option value="IDLE">Idle</option>
            <option value="BREAKDOWN">Breakdown</option><option value="MAINTENANCE">Maintenance</option><option value="OFFLINE">Offline</option>
          </select>
        }
        onExport={(fmt) => window.open(machineApi.exportUrl(fmt))}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Machine' : 'Add Machine'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Machine Code" required register={register} name="machineCode" error={errors.machineCode} />
            <Input label="Name" required register={register} name="name" error={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Type" required register={register} name="machineType" error={errors.machineType} />
            <Input label="Manufacturer" register={register} name="manufacturer" />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Select label="Department" register={register} name="departmentId" placeholder="Select department"
              options={departments.map((d) => ({ value: d.id, label: d.name }))} />
            <Input label="Rated Speed" type="number" register={register} name="ratedSpeed" />
          </div>
          <Input label="Location" register={register} name="location" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Machine'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete machine?" message={`This will permanently delete "${deleting?.name}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
