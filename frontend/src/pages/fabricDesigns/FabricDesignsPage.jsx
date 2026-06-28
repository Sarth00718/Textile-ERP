import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { fabricDesignApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input } from '../../components/common/FormFields';

const schema = z.object({
  designCode: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Required'),
  fabricType: z.string().min(1, 'Required'),
  widthInches: z.coerce.number().positive().optional(),
  weightGsm: z.coerce.number().positive().optional(),
  warpYarnCount: z.string().optional(),
  weftYarnCount: z.string().optional(),
  standardRate: z.coerce.number().nonnegative().optional(),
});

export default function FabricDesignsPage() {
  const { can } = usePermission();
  const table = useDataTable(fabricDesignApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ designCode: '', name: '', fabricType: '' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({
      designCode: row.design_code, name: row.name, fabricType: row.fabric_type,
      widthInches: row.width_inches || '', weightGsm: row.weight_gsm || '',
      warpYarnCount: row.warp_yarn_count || '', weftYarnCount: row.weft_yarn_count || '',
      standardRate: row.standard_rate || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await fabricDesignApi.update(editing.id, values); toast.success('Design updated'); }
      else { await fabricDesignApi.create(values); toast.success('Fabric design created'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await fabricDesignApi.remove(deleting.id);
      toast.success('Design deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete design');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'design_code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'fabric_type', header: 'Type' },
    { key: 'width_inches', header: 'Width (in)', render: (r) => r.width_inches || '—' },
    { key: 'weight_gsm', header: 'Weight (GSM)', render: (r) => r.weight_gsm || '—' },
    { key: 'standard_rate', header: 'Rate', render: (r) => r.standard_rate ? `₹${r.standard_rate}` : '—' },
    {
      key: 'actions', header: '',
      render: (r) => can('fabricDesign', 'manage') && (
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
        title="Fabric Designs"
        description="Fabric specifications used across production and sales"
        action={can('fabricDesign', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> New Design</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onSearch={table.handleSearch} searchPlaceholder="Search fabric designs…"
        onExport={(fmt) => window.open(fabricDesignApi.exportUrl(fmt))}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Design' : 'New Fabric Design'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Design Code" required register={register} name="designCode" error={errors.designCode} />
            <Input label="Name" required register={register} name="name" error={errors.name} />
          </div>
          <Input label="Fabric Type" required register={register} name="fabricType" error={errors.fabricType} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Width (inches)" type="number" register={register} name="widthInches" />
            <Input label="Weight (GSM)" type="number" register={register} name="weightGsm" />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Warp Yarn Count" register={register} name="warpYarnCount" />
            <Input label="Weft Yarn Count" register={register} name="weftYarnCount" />
          </div>
          <Input label="Standard Rate (₹/m)" type="number" step="0.01" register={register} name="standardRate" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Design'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete fabric design?" message={`This will permanently delete "${deleting?.name}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
