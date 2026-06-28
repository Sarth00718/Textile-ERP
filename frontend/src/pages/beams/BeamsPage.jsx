import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { beamApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  beamCode: z.string().min(1, 'Required'),
  yarnCount: z.string().optional(),
  totalEnds: z.coerce.number().int().positive().optional(),
  lengthMeters: z.coerce.number().positive().optional(),
});

export default function BeamsPage() {
  const { can } = usePermission();
  const table = useDataTable(beamApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ beamCode: '' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({ beamCode: row.beam_code, yarnCount: row.yarn_count || '', totalEnds: row.total_ends || '', lengthMeters: row.length_meters || '' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await beamApi.update(editing.id, values); toast.success('Beam updated'); }
      else { await beamApi.create(values); toast.success('Beam added to stock'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await beamApi.remove(deleting.id);
      toast.success('Beam deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete beam (it may be in use)');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'beam_code', header: 'Beam Code' },
    { key: 'yarn_count', header: 'Yarn Count', render: (r) => r.yarn_count || '—' },
    { key: 'total_ends', header: 'Total Ends', render: (r) => r.total_ends || '—' },
    { key: 'length_meters', header: 'Length (m)', render: (r) => r.length_meters || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      render: (r) => can('beams', 'manage') && (
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
        title="Beam Management"
        description="Warp beam inventory and lifecycle"
        action={can('beams', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Beam</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} onSearch={table.handleSearch} searchPlaceholder="Search beams…"
        filters={
          <select onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="IN_STOCK">In Stock</option><option value="ALLOCATED">Allocated</option>
            <option value="IN_USE">In Use</option><option value="EMPTY">Empty</option><option value="DAMAGED">Damaged</option>
          </select>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Beam' : 'Add Beam'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Beam Code" required register={register} name="beamCode" error={errors.beamCode} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Yarn Count" register={register} name="yarnCount" />
            <Input label="Total Ends" type="number" register={register} name="totalEnds" />
          </div>
          <Input label="Length (meters)" type="number" step="0.01" register={register} name="lengthMeters" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Beam'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete beam?" message={`This will permanently delete beam "${deleting?.beam_code}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
