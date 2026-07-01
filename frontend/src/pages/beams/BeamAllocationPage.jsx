import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { beamAllocationApi, beamApi, machineApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Select } from '../../components/common/FormFields';

const schema = z.object({
  beamId: z.string().min(1, 'Select a beam'),
  machineId: z.string().min(1, 'Select a machine'),
});

export default function BeamAllocationPage() {
  const { can } = usePermission();
  const table = useDataTable(beamAllocationApi.list);
  const [beams, setBeams] = useState([]);
  const [machines, setMachines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [releasing, setReleasing] = useState(null);
  const [metersUsed, setMetersUsed] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    beamApi.list({ status: 'IN_STOCK', pageSize: 100 }).then((res) => setBeams(res.items || []));
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
  }, [modalOpen]);

  async function onSubmit(values) {
    try {
      await beamAllocationApi.allocate(values);
      toast.success('Beam allocated to machine');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not allocate beam');
    }
  }

  async function confirmRelease() {
    try {
      await beamAllocationApi.release(releasing.id, { metersUsed: Number(metersUsed) || 0 });
      toast.success('Allocation released');
      setReleasing(null);
      setMetersUsed('');
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not release allocation');
    }
  }

  const columns = [
    { key: 'beam_code', header: 'Beam' },
    { key: 'machine_name', header: 'Machine', render: (r) => `${r.machine_code} — ${r.machine_name}` },
    { key: 'allocated_at', header: 'Allocated', render: (r) => new Date(r.allocated_at).toLocaleString() },
    { key: 'is_active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
    { key: 'meters_used', header: 'Meters Used', render: (r) => r.meters_used || 0 },
    {
      key: 'actions', header: '',
      render: (r) => r.is_active && can('beamAllocation', 'manage') && (
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setReleasing(r); }}>Release</Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Beam Allocation"
        description="Assign beams to machines — allocation moves a beam from in-stock to in-use"
        action={can('beamAllocation', 'manage') && <Button onClick={() => { reset(); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Allocate Beam</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onExport={(fmt) => beamAllocationApi.download(fmt, {})} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Allocate Beam to Machine">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Beam (in stock)" required register={register} name="beamId" placeholder="Select beam" error={errors.beamId}
            options={beams.map((b) => ({ value: b.id, label: b.beam_code }))} />
          <Select label="Machine" required register={register} name="machineId" placeholder="Select machine" error={errors.machineId}
            options={machines.map((m) => ({ value: m.id, label: `${m.machine_code} — ${m.name}` }))} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Allocate</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!releasing} onClose={() => setReleasing(null)} title="Release Allocation">
        <label className="mb-1 block text-sm font-medium text-steel-700 dark:text-steel-200">Meters Used</label>
        <input
          type="number"
          value={metersUsed}
          onChange={(e) => setMetersUsed(e.target.value)}
          className="w-full rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-3 py-2 text-sm mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setReleasing(null)}>Cancel</Button>
          <Button onClick={confirmRelease}>Release</Button>
        </div>
      </Modal>
    </div>
  );
}
