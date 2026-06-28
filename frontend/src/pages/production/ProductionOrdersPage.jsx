import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { productionOrderApi, workOrderApi, machineApi, beamApi, employeeApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  productionOrderNo: z.string().min(1, 'Required'),
  workOrderId: z.string().min(1, 'Select a work order'),
  machineId: z.string().min(1, 'Select a machine'),
  beamId: z.string().optional(),
  targetQuantityMeters: z.coerce.number().positive('Must be positive'),
  assignedOperatorId: z.string().optional(),
});

export default function ProductionOrdersPage() {
  const { can } = usePermission();
  const table = useDataTable(productionOrderApi.list);
  const [workOrders, setWorkOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [beams, setBeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    workOrderApi.list({ pageSize: 200, status: 'PLANNED' }).then((res) => setWorkOrders(res.items || []));
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
    beamApi.list({ status: 'ALLOCATED', pageSize: 100 }).then((res) => setBeams(res.items || []));
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
  }, [modalOpen]);

  async function onSubmit(values) {
    try {
      await productionOrderApi.create(values);
      toast.success('Production order created — machine assigned');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create production order');
    }
  }

  const columns = [
    { key: 'production_order_no', header: 'PO Number' },
    { key: 'machine_name', header: 'Machine', render: (r) => `${r.machine_code} — ${r.machine_name}` },
    { key: 'work_order_no', header: 'Work Order' },
    { key: 'target_quantity_meters', header: 'Target (m)' },
    { key: 'produced_quantity_meters', header: 'Produced (m)' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Production Orders" description="Machine-level production assignments under a work order"
        action={can('productionOrders', 'manage') && <Button onClick={() => { reset(); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> New Production Order</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        filters={
          <select onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option><option value="ON_HOLD">On Hold</option><option value="CANCELLED">Cancelled</option>
          </select>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Production Order">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Production Order No" required register={register} name="productionOrderNo" error={errors.productionOrderNo} />
          <Select label="Work Order" required register={register} name="workOrderId" placeholder="Select work order" error={errors.workOrderId}
            options={workOrders.map((w) => ({ value: w.id, label: w.work_order_no }))} />
          <Select label="Machine" required register={register} name="machineId" placeholder="Select machine" error={errors.machineId}
            options={machines.map((m) => ({ value: m.id, label: `${m.machine_code} — ${m.name}` }))} />
          <Select label="Beam (optional, must already be allocated to the machine)" register={register} name="beamId" placeholder="None"
            options={beams.map((b) => ({ value: b.id, label: b.beam_code }))} />
          <Input label="Target Quantity (m)" type="number" required register={register} name="targetQuantityMeters" error={errors.targetQuantityMeters} />
          <Select label="Operator" register={register} name="assignedOperatorId" placeholder="Unassigned"
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
