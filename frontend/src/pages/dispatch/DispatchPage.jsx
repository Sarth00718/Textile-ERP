import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { dispatchApi, salesOrderApi, vehicleApi, packingApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

export default function DispatchPage() {
  const { can } = usePermission();
  const table = useDataTable(dispatchApi.list);
  const [salesOrders, setSalesOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [packedRecords, setPackedRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: { salesOrderId: '', vehicleId: '', items: [{ packingRecordId: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    salesOrderApi.list({ pageSize: 200 }).then((res) => setSalesOrders((res.items || []).filter((s) => !['DRAFT', 'DISPATCHED', 'CANCELLED'].includes(s.status))));
    vehicleApi.list({ status: 'AVAILABLE', pageSize: 100 }).then((res) => setVehicles(res.items || []));
    packingApi.list({ status: 'PACKED', pageSize: 200 }).then((res) => setPackedRecords(res.items || []));
  }, [modalOpen]);

  function openCreate() {
    reset({ salesOrderId: '', vehicleId: '', items: [{ packingRecordId: '' }] });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      const payload = { ...values, items: values.items.map((i) => ({ packingRecordId: i.packingRecordId })) };
      await dispatchApi.create(payload);
      toast.success('Dispatch created — sales order and inventory updated');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create dispatch');
    }
  }

  async function viewDispatch(row) {
    const res = await dispatchApi.get(row.id);
    setViewing(res.data);
  }

  async function handleInTransit() {
    try { await dispatchApi.markInTransit(viewing.id); toast.success('Marked in transit'); setViewing(null); table.reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not update'); }
  }
  async function handleDelivered() {
    try { await dispatchApi.markDelivered(viewing.id); toast.success('Marked delivered — vehicle freed'); setViewing(null); table.reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not update'); }
  }

  const columns = [
    { key: 'dispatch_no', header: 'Dispatch No' },
    { key: 'so_number', header: 'Sales Order' },
    { key: 'customer_name', header: 'Customer' },
    { key: 'vehicle_number', header: 'Vehicle', render: (r) => r.vehicle_number || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total_weight_kg', header: 'Weight (kg)', render: (r) => r.total_weight_kg || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Dispatch"
        description="Final fulfillment step — dispatching updates the sales order and frees inventory"
        action={can('dispatch', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> New Dispatch</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} onRowClick={viewDispatch}
        onExport={(fmt) => window.open(dispatchApi.list ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/dispatch?format=${fmt}` : undefined)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Dispatch" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Sales Order" required register={register} name="salesOrderId" placeholder="Select sales order"
            options={salesOrders.map((s) => ({ value: s.id, label: `${s.so_number} — ${s.customer_name}` }))} />
          <Select label="Vehicle (optional)" register={register} name="vehicleId" placeholder="None"
            options={vehicles.map((v) => ({ value: v.id, label: v.vehicle_number }))} />

          <div className="mb-2 text-sm font-medium text-steel-700 dark:text-steel-200">Packed rolls to dispatch</div>
          {fields.map((field, idx) => (
            <div key={field.id} className="mb-2 grid grid-cols-[1fr_auto] gap-2 items-end">
              <select {...register(`items.${idx}.packingRecordId`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm">
                <option value="">Select packed roll</option>
                {packedRecords.map((p) => <option key={p.id} value={p.id}>{p.package_no} — {p.roll_no} ({p.length_meters} m)</option>)}
              </select>
              <button type="button" onClick={() => remove(idx)} className="rounded p-2 hover:bg-steel-100 dark:hover:bg-steel-700">
                <TrashIcon className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => append({ packingRecordId: '' })} className="mb-4 text-sm font-medium text-amber-600 hover:underline">+ Add roll</button>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Dispatch</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Dispatch ${viewing.dispatch_no}` : ''}>
        {viewing && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <StatusBadge status={viewing.status} />
              <div className="flex gap-2">
                {viewing.status === 'PENDING' && can('dispatch', 'manage') && <Button size="sm" onClick={handleInTransit}>Mark In Transit</Button>}
                {['PENDING', 'IN_TRANSIT'].includes(viewing.status) && can('dispatch', 'manage') && <Button size="sm" onClick={handleDelivered}>Mark Delivered</Button>}
              </div>
            </div>
            <ul className="text-sm divide-y divide-steel-100 dark:divide-steel-800">
              {viewing.items?.map((item) => (
                <li key={item.id} className="py-1.5 flex justify-between">
                  <span>{item.roll_no}</span>
                  <span className="tabular text-steel-500">{item.quantity_meters} m</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
