import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { workOrderApi, fabricDesignApi, productionPlanApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const STATUS_OPTIONS = ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];

const schema = z.object({
  workOrderNo: z.string().min(1, 'Required'),
  fabricDesignId: z.string().min(1, 'Select a fabric design'),
  productionPlanId: z.string().optional(),
  targetQuantityMeters: z.coerce.number().positive('Must be positive'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export default function WorkOrdersPage() {
  const { can } = usePermission();
  const table = useDataTable(workOrderApi.list);
  const [designs, setDesigns] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    fabricDesignApi.list({ pageSize: 200 }).then((res) => setDesigns(res.items || []));
    productionPlanApi.list({ pageSize: 100 }).then((res) => setPlans(res.items || []));
  }, []);

  async function onSubmit(values) {
    try {
      await workOrderApi.create(values);
      toast.success('Work order created');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create work order');
    }
  }

  async function updateStatus(row, status) {
    try {
      await workOrderApi.update(row.id, { status });
      toast.success(`Work order set to ${status}`);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  }

  const columns = [
    { key: 'work_order_no', header: 'WO Number' },
    { key: 'fabric_design_name', header: 'Fabric Design' },
    { key: 'target_quantity_meters', header: 'Target (m)' },
    { key: 'due_date', header: 'Due', render: (r) => r.due_date || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      render: (r) => can('workOrders', 'manage') && !['COMPLETED', 'CANCELLED'].includes(r.status) && (
        <select defaultValue="" onChange={(e) => { if (e.target.value) updateStatus(r, e.target.value); }} onClick={(e) => e.stopPropagation()}
          className="rounded border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 text-xs px-1.5 py-1">
          <option value="">Set status…</option>
          {STATUS_OPTIONS.filter((s) => s !== r.status).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Work Orders" description="Aggregate production targets, optionally tied to sales orders"
        action={can('workOrders', 'manage') && <Button onClick={() => { reset(); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> New Work Order</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Work Order">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Work Order No" required register={register} name="workOrderNo" error={errors.workOrderNo} />
          <Select label="Fabric Design" required register={register} name="fabricDesignId" placeholder="Select design" error={errors.fabricDesignId}
            options={designs.map((d) => ({ value: d.id, label: d.name }))} />
          <Select label="Production Plan (optional)" register={register} name="productionPlanId" placeholder="None"
            options={plans.map((p) => ({ value: p.id, label: p.plan_code }))} />
          <Input label="Target Quantity (m)" type="number" required register={register} name="targetQuantityMeters" error={errors.targetQuantityMeters} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Start Date" type="date" register={register} name="startDate" />
            <Input label="Due Date" type="date" register={register} name="dueDate" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
