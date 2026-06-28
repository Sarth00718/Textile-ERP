import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { machineMaintenanceApi, machineApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select, Textarea } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const MAINT_TYPES = [
  { value: 'PREVENTIVE', label: 'Preventive' }, { value: 'CORRECTIVE', label: 'Corrective' }, { value: 'PREDICTIVE', label: 'Predictive' },
];
const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' }, { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
];

const schema = z.object({
  machineId: z.string().min(1, 'Select a machine'),
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE']),
  scheduledDate: z.string().min(1, 'Required'),
  description: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional(),
});

export default function MachineMaintenancePage() {
  const { can } = usePermission();
  const table = useDataTable(machineMaintenanceApi.list);
  const [machines, setMachines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
  }, []);

  function openCreate() {
    setEditing(null);
    reset({ maintenanceType: 'PREVENTIVE' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await machineMaintenanceApi.create(values);
      toast.success('Maintenance scheduled');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not schedule maintenance');
    }
  }

  async function updateStatus(row, status) {
    try {
      await machineMaintenanceApi.update(row.id, { status, completedDate: status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : undefined });
      toast.success(`Marked as ${status.toLowerCase()}`);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update maintenance');
    }
  }

  const columns = [
    { key: 'machine_name', header: 'Machine', render: (r) => `${r.machine_code} — ${r.machine_name}` },
    { key: 'maintenance_type', header: 'Type' },
    { key: 'scheduled_date', header: 'Scheduled' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'cost', header: 'Cost', render: (r) => `₹${Number(r.cost || 0).toLocaleString()}` },
    {
      key: 'actions', header: '',
      render: (r) => can('machineMaintenance', 'manage') && r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
        <select
          defaultValue=""
          onChange={(e) => { if (e.target.value) updateStatus(r, e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 text-xs px-1.5 py-1"
        >
          <option value="">Set status…</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Machine Maintenance"
        description="Preventive and corrective maintenance scheduling"
        action={can('machineMaintenance', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Schedule Maintenance</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Maintenance">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Machine" required register={register} name="machineId" placeholder="Select machine" error={errors.machineId}
            options={machines.map((m) => ({ value: m.id, label: `${m.machine_code} — ${m.name}` }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Select label="Type" required register={register} name="maintenanceType" options={MAINT_TYPES} />
            <Input label="Scheduled Date" type="date" required register={register} name="scheduledDate" error={errors.scheduledDate} />
          </div>
          <Input label="Estimated Cost" type="number" step="0.01" register={register} name="cost" />
          <Textarea label="Description" register={register} name="description" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
