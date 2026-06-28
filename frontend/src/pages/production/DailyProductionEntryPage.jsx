import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { dailyProductionEntryApi, productionOrderApi, employeeApi, inventoryApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select, Checkbox, Textarea } from '../../components/common/FormFields';

const schema = z.object({
  productionOrderId: z.string().min(1, 'Select a production order'),
  entryDate: z.string().optional(),
  shiftName: z.string().optional(),
  operatorId: z.string().optional(),
  quantityProducedMeters: z.coerce.number().positive('Must be positive'),
  quantityRejectedMeters: z.coerce.number().nonnegative().optional(),
  rawMaterialItemId: z.string().optional(),
  rawMaterialQuantity: z.coerce.number().nonnegative().optional(),
  createFabricRoll: z.boolean().optional(),
  remarks: z.string().optional(),
});

export default function DailyProductionEntryPage() {
  const { can } = usePermission();
  const table = useDataTable(dailyProductionEntryApi.list);
  const [productionOrders, setProductionOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { entryDate: new Date().toISOString().slice(0, 10), shiftName: 'DAY', createFabricRoll: true },
  });

  useEffect(() => {
    productionOrderApi.list({ pageSize: 200, status: 'IN_PROGRESS' }).then((res) => setProductionOrders(res.items || []));
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
    inventoryApi.list({ pageSize: 200, category: 'YARN' }).then((res) => setInventoryItems(res.items || []));
  }, [modalOpen]);

  async function onSubmit(values) {
    try {
      await dailyProductionEntryApi.create(values);
      toast.success('Production logged — order, inventory, and fabric roll updated');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not log production');
    }
  }

  const columns = [
    { key: 'entry_date', header: 'Date' },
    { key: 'production_order_no', header: 'Production Order' },
    { key: 'machine_name', header: 'Machine', render: (r) => `${r.machine_code} — ${r.machine_name}` },
    { key: 'operator_name', header: 'Operator', render: (r) => r.operator_name || '—' },
    { key: 'quantity_produced_meters', header: 'Produced (m)' },
    { key: 'quantity_rejected_meters', header: 'Rejected (m)' },
  ];

  return (
    <div>
      <PageHeader
        title="Daily Production Entry"
        description="Logging an entry automatically updates the production order, consumes raw material, and creates a fabric roll"
        action={can('dailyProductionEntry', 'manage') && <Button onClick={() => { reset(); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Log Production</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Daily Production" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Production Order" required register={register} name="productionOrderId" placeholder="Select production order" error={errors.productionOrderId}
            options={productionOrders.map((po) => ({ value: po.id, label: `${po.production_order_no} (${po.machine_code})` }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Date" type="date" register={register} name="entryDate" />
            <Select label="Shift" register={register} name="shiftName"
              options={[{ value: 'DAY', label: 'Day' }, { value: 'NIGHT', label: 'Night' }]} />
          </div>
          <Select label="Operator" register={register} name="operatorId" placeholder="Unassigned"
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Quantity Produced (m)" type="number" required register={register} name="quantityProducedMeters" error={errors.quantityProducedMeters} />
            <Input label="Quantity Rejected (m)" type="number" register={register} name="quantityRejectedMeters" />
          </div>

          <div className="rounded-md bg-steel-50 dark:bg-steel-800 p-3 mb-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-steel-500">
              <InformationCircleIcon className="h-4 w-4" /> Optional: consume raw material from inventory
            </div>
            <div className="grid grid-cols-2 gap-x-3">
              <Select label="Raw Material" register={register} name="rawMaterialItemId" placeholder="None"
                options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (${i.current_stock} ${i.unit} left)` }))} />
              <Input label="Quantity Consumed" type="number" register={register} name="rawMaterialQuantity" />
            </div>
          </div>

          <Checkbox label="Create a fabric roll from this entry" register={register} name="createFabricRoll" defaultChecked />
          <Textarea label="Remarks" register={register} name="remarks" />

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Production</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
