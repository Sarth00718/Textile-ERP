import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { machineBreakdownApi, machineApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Select, Textarea } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  machineId: z.string().min(1, 'Select a machine'),
  issueDescription: z.string().min(2, 'Describe the issue'),
});

export default function MachineBreakdownsPage() {
  const { can } = usePermission();
  const table = useDataTable(machineBreakdownApi.list);
  const [machines, setMachines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolving, setResolving] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
  }, []);

  async function onSubmit(values) {
    try {
      await machineBreakdownApi.create(values);
      toast.success('Breakdown reported — machine flagged');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not report breakdown');
    }
  }

  async function confirmResolve() {
    try {
      await machineBreakdownApi.resolve(resolving.id, { resolutionNotes });
      toast.success('Breakdown resolved — machine returned to idle');
      setResolving(null);
      setResolutionNotes('');
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resolve breakdown');
    }
  }

  const columns = [
    { key: 'machine_name', header: 'Machine', render: (r) => `${r.machine_code} — ${r.machine_name}` },
    { key: 'issue_description', header: 'Issue' },
    { key: 'reported_at', header: 'Reported', render: (r) => new Date(r.reported_at).toLocaleString() },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'downtime_minutes', header: 'Downtime (min)', render: (r) => r.downtime_minutes ?? '—' },
    {
      key: 'actions', header: '',
      render: (r) => r.status !== 'RESOLVED' && can('machineBreakdown', 'manage') && (
        <button onClick={(e) => { e.stopPropagation(); setResolving(r); }} className="inline-flex items-center gap-1 rounded p-1 text-xs text-signal-run hover:bg-green-100 dark:hover:bg-green-900/30">
          <CheckCircleIcon className="h-4 w-4" /> Resolve
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Machine Breakdown"
        description="Reported issues and resolution tracking"
        action={can('machineBreakdown', 'manage') && <Button onClick={() => { reset(); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Report Breakdown</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        filters={
          <select onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option>
          </select>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Report Breakdown">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Machine" required register={register} name="machineId" placeholder="Select machine" error={errors.machineId}
            options={machines.map((m) => ({ value: m.id, label: `${m.machine_code} — ${m.name}` }))} />
          <Textarea label="Issue Description" required register={register} name="issueDescription" error={errors.issueDescription} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Report</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolve Breakdown">
        <div>
          <p className="mb-2 text-sm text-steel-600 dark:text-steel-300">{resolving?.issue_description}</p>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Resolution notes"
            className="w-full rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-3 py-2 text-sm mb-3"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResolving(null)}>Cancel</Button>
            <Button onClick={confirmResolve}>Mark Resolved</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
