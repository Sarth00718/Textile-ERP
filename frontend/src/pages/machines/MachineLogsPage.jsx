import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { machineLogApi, machineApi, employeeApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Select, Textarea } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const EVENT_TYPES = [
  { value: 'START', label: 'Start' }, { value: 'STOP', label: 'Stop' },
  { value: 'IDLE', label: 'Idle' }, { value: 'BREAKDOWN', label: 'Breakdown' }, { value: 'MAINTENANCE', label: 'Maintenance' },
];

const schema = z.object({
  machineId: z.string().min(1, 'Select a machine'),
  eventType: z.enum(['START', 'STOP', 'BREAKDOWN', 'MAINTENANCE', 'IDLE']),
  operatorId: z.string().optional(),
  notes: z.string().optional(),
});

export default function MachineLogsPage() {
  const { can } = usePermission();
  const table = useDataTable(machineLogApi.list);
  const [machines, setMachines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
  }, []);

  function openCreate() {
    reset({ eventType: 'START' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await machineLogApi.create(values);
      toast.success('Log recorded — machine status updated');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record log');
    }
  }

  const columns = [
    { key: 'event_time', header: 'Time', render: (r) => new Date(r.event_time).toLocaleString() },
    { key: 'machine_name', header: 'Machine', render: (r) => `${r.machine_code} — ${r.machine_name}` },
    { key: 'event_type', header: 'Event', render: (r) => <StatusBadge status={r.event_type} /> },
    { key: 'operator_name', header: 'Operator', render: (r) => r.operator_name || '—' },
    { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Machine Logs"
        description="Start/stop/breakdown events — recording an event updates the machine's live status automatically"
        action={can('machineLogs', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Log Event</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Machine Event">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Machine" required register={register} name="machineId" placeholder="Select machine" error={errors.machineId}
            options={machines.map((m) => ({ value: m.id, label: `${m.machine_code} — ${m.name}` }))} />
          <Select label="Event Type" required register={register} name="eventType" options={EVENT_TYPES} />
          <Select label="Operator" register={register} name="operatorId" placeholder="None"
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
          <Textarea label="Notes" register={register} name="notes" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
