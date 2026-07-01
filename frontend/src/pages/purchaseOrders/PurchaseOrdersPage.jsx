import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { purchaseOrderApi, supplierApi, inventoryApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

export default function PurchaseOrdersPage() {
  const { can } = usePermission();
  const table = useDataTable(purchaseOrderApi.list);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [receiveQty, setReceiveQty] = useState({});

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: { poNumber: '', supplierId: '', items: [{ inventoryItemId: '', quantityOrdered: '', unitPrice: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    supplierApi.list({ pageSize: 200 }).then((res) => setSuppliers(res.items || []));
    inventoryApi.list({ pageSize: 200 }).then((res) => setItems(res.items || []));
  }, []);

  function openCreate() {
    reset({ poNumber: '', supplierId: '', items: [{ inventoryItemId: '', quantityOrdered: '', unitPrice: '' }] });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      const payload = {
        ...values,
        items: values.items.map((i) => ({
          inventoryItemId: i.inventoryItemId,
          quantityOrdered: Number(i.quantityOrdered),
          unitPrice: Number(i.unitPrice),
        })),
      };
      await purchaseOrderApi.create(payload);
      toast.success('Purchase order created');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create purchase order');
    }
  }

  async function viewPO(row) {
    const res = await purchaseOrderApi.get(row.id);
    setViewing(res.data);
    setReceiveQty({});
  }

  async function handleSend(id) {
    try {
      await purchaseOrderApi.send(id);
      toast.success('Purchase order sent to supplier');
      setViewing(null);
      table.reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not send PO'); }
  }

  async function handleReceive() {
    const receipts = Object.entries(receiveQty)
      .filter(([, v]) => Number(v) > 0)
      .map(([poItemId, quantityReceived]) => ({ poItemId, quantityReceived: Number(quantityReceived) }));
    if (!receipts.length) { toast.error('Enter at least one received quantity'); return; }
    try {
      await purchaseOrderApi.receive(viewing.id, { receipts });
      toast.success('Goods received — inventory updated');
      setViewing(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not receive goods');
    }
  }

  const columns = [
    { key: 'po_number', header: 'PO Number' },
    { key: 'supplier_name', header: 'Supplier' },
    { key: 'order_date', header: 'Order Date' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total_amount', header: 'Total', render: (r) => `₹${Number(r.total_amount).toLocaleString()}` },
  ];

  return (
    <div>
      <PageHeader title="Purchase Orders" description="Procurement from suppliers — receiving goods updates inventory automatically"
        action={can('purchaseOrders', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> New Purchase Order</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} onRowClick={viewPO}
        onExport={(fmt) => purchaseOrderApi.download(fmt, { ...table.filters })} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="PO Number" required register={register} name="poNumber" />
            <Select label="Supplier" required register={register} name="supplierId" placeholder="Select supplier"
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
          </div>

          <div className="mb-2 text-sm font-medium text-steel-700 dark:text-steel-200">Items</div>
          {fields.map((field, idx) => (
            <div key={field.id} className="mb-2 grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end">
              <select {...register(`items.${idx}.inventoryItemId`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm">
                <option value="">Select item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input type="number" placeholder="Qty" {...register(`items.${idx}.quantityOrdered`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Unit Price" {...register(`items.${idx}.unitPrice`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm" />
              <button type="button" onClick={() => remove(idx)} className="rounded p-2 hover:bg-steel-100 dark:hover:bg-steel-700">
                <TrashIcon className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => append({ inventoryItemId: '', quantityOrdered: '', unitPrice: '' })}
            className="mb-4 text-sm font-medium text-amber-600 hover:underline">+ Add line item</button>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Purchase Order</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Purchase Order ${viewing.po_number}` : ''} maxWidth="max-w-2xl">
        {viewing && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <StatusBadge status={viewing.status} />
              <div className="flex gap-2">
                {viewing.status === 'DRAFT' && can('purchaseOrders', 'manage') && <Button size="sm" onClick={() => handleSend(viewing.id)}>Send to Supplier</Button>}
                {['SENT', 'PARTIALLY_RECEIVED'].includes(viewing.status) && can('purchaseOrders', 'manage') && <Button size="sm" onClick={handleReceive}>Receive Goods</Button>}
              </div>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-steel-50 dark:bg-steel-800">
                <tr>
                  {['Item', 'Ordered', 'Received', 'Price', ...(['SENT', 'PARTIALLY_RECEIVED'].includes(viewing.status) ? ['Receive Now'] : [])].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase text-steel-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100 dark:divide-steel-800">
                {viewing.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.item_name}</td>
                    <td className="px-3 py-2 tabular">{item.quantity_ordered} {item.unit}</td>
                    <td className="px-3 py-2 tabular">{item.quantity_received} {item.unit}</td>
                    <td className="px-3 py-2 tabular">₹{item.unit_price}</td>
                    {['SENT', 'PARTIALLY_RECEIVED'].includes(viewing.status) && (
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="0"
                          max={item.quantity_ordered - item.quantity_received}
                          onChange={(e) => setReceiveQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-20 rounded border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-1 text-sm"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
