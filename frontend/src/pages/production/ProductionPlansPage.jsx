import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { productionPlanApi, fabricDesignApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Select, Textarea } from '../../components/common/FormFields';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' }, { value: 'NORMAL', label: 'Normal' }, { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' },
];

const schema = z.object({
  planCode: z.string().min(1, 'Required'),
  fabricDesignId: z.string().min(1, 'Select a fabric design'),
  plannedQuantityMeters: z.coerce.number().positive('Must be positive'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  notes: z.string().optional(),
});

export default function ProductionPlansPage() {
  const { can } = usePermission();
  const table = useDataTable(productionPlanApi.list);
  const [designs, setDesigns] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { priority: 'NORMAL' } });

  useEffect(() => {
    fabricDesignApi.list({ pageSize: 200 }).then((res) => setDesigns(res.items || []));
  }, []);

  function openCreate() { setEditing(null); reset({ priority: 'NORMAL' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({
      planCode: row.plan_code, fabricDesignId: row.fabric_design_id, plannedQuantityMeters: row.planned_quantity_meters,
      startDate: row.start_date?.slice(0, 10), endDate: row.end_date?.slice(0, 10), priority: row.priority, notes: row.notes || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await productionPlanApi.update(editing.id, values); toast.success('Plan updated'); }
      else { await productionPlanApi.create(values); toast.success('Production plan created'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await productionPlanApi.remove(deleting.id);
      toast.success('Plan deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete plan');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'plan_code', header: 'Code' },
    { key: 'fabric_design_name', header: 'Fabric Design' },
    { key: 'planned_quantity_meters', header: 'Planned (m)' },
    { key: 'start_date', header: 'Start' },
    { key: 'end_date', header: 'End' },
    { key: 'priority', header: 'Priority' },
    {
      key: 'actions', header: '',
      render: (r) => can('productionPlanning', 'manage') && (
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
      <PageHeader title="Production Planning" description="Forward production plans by fabric design"
        action={can('productionPlanning', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> New Plan</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'New Production Plan'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Plan Code" required register={register} name="planCode" error={errors.planCode} />
            <Select label="Fabric Design" required register={register} name="fabricDesignId" placeholder="Select design" error={errors.fabricDesignId}
              options={designs.map((d) => ({ value: d.id, label: d.name }))} />
          </div>
          <Input label="Planned Quantity (m)" type="number" required register={register} name="plannedQuantityMeters" error={errors.plannedQuantityMeters} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Start Date" type="date" required register={register} name="startDate" error={errors.startDate} />
            <Input label="End Date" type="date" required register={register} name="endDate" error={errors.endDate} />
          </div>
          <Select label="Priority" register={register} name="priority" options={PRIORITY_OPTIONS} />
          <Textarea label="Notes" register={register} name="notes" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete plan?" message={`This will permanently delete plan "${deleting?.plan_code}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
