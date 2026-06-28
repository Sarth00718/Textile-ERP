import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { salesOrderApi, customerApi, fabricDesignApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const NEXT_STATUS = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['DISPATCHED', 'CANCELLED'],
};

export default function SalesOrdersPage() {
  const { can } = usePermission();
  const table = useDataTable(salesOrderApi.list);
  const [customers, setCustomers] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: { soNumber: '', customerId: '', items: [{ fabricDesignId: '', quantityMeters: '', unitPrice: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    customerApi.list({ pageSize: 200 }).then((res) => setCustomers(res.items || []));
    fabricDesignApi.list({ pageSize: 200 }).then((res) => setDesigns(res.items || []));
  }, []);

  function openCreate() {
    reset({ soNumber: '', customerId: '', items: [{ fabricDesignId: '', quantityMeters: '', unitPrice: '' }] });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      const payload = {
        ...values,
        items: values.items.map((i) => ({
          fabricDesignId: i.fabricDesignId, quantityMeters: Number(i.quantityMeters), unitPrice: Number(i.unitPrice),
        })),
      };
      await salesOrderApi.create(payload);
      toast.success('Sales order created');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create sales order');
    }
  }

  async function viewSO(row) {
    const res = await salesOrderApi.get(row.id);
    setViewing(res.data);
    setPaymentAmount('');
  }

  async function handleStatusChange(status) {
    try {
      await salesOrderApi.updateStatus(viewing.id, { status });
      toast.success(`Sales order set to ${status}`);
      setViewing(null);
      table.reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not update status'); }
  }

  async function handlePayment() {
    if (!Number(paymentAmount) > 0) { toast.error('Enter a valid payment amount'); return; }
    try {
      await salesOrderApi.recordPayment(viewing.id, { amount: Number(paymentAmount) });
      toast.success('Payment recorded');
      setViewing(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record payment');
    }
  }

  const columns = [
    { key: 'so_number', header: 'SO Number' },
    { key: 'customer_name', header: 'Customer' },
    { key: 'order_date', header: 'Order Date' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total_amount', header: 'Total', render: (r) => `₹${Number(r.total_amount).toLocaleString()}` },
    { key: 'amount_paid', header: 'Paid', render: (r) => `₹${Number(r.amount_paid).toLocaleString()}` },
  ];

  return (
    <div>
      <PageHeader title="Sales Orders" description="Customer orders — dispatch automatically updates status and inventory"
        action={can('salesOrders', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> New Sales Order</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} onRowClick={viewSO} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sales Order" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="SO Number" required register={register} name="soNumber" />
            <Select label="Customer" required register={register} name="customerId" placeholder="Select customer"
              options={customers.map((c) => ({ value: c.id, label: c.name }))} />
          </div>

          <div className="mb-2 text-sm font-medium text-steel-700 dark:text-steel-200">Items</div>
          {fields.map((field, idx) => (
            <div key={field.id} className="mb-2 grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end">
              <select {...register(`items.${idx}.fabricDesignId`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm">
                <option value="">Select fabric</option>
                {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="number" placeholder="Meters" {...register(`items.${idx}.quantityMeters`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Unit Price" {...register(`items.${idx}.unitPrice`)} className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-2 text-sm" />
              <button type="button" onClick={() => remove(idx)} className="rounded p-2 hover:bg-steel-100 dark:hover:bg-steel-700">
                <TrashIcon className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => append({ fabricDesignId: '', quantityMeters: '', unitPrice: '' })}
            className="mb-4 text-sm font-medium text-amber-600 hover:underline">+ Add line item</button>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Sales Order</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Sales Order ${viewing.so_number}` : ''} maxWidth="max-w-2xl">
        {viewing && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <StatusBadge status={viewing.status} />
              {can('salesOrders', 'manage') && (NEXT_STATUS[viewing.status] || []).length > 0 && (
                <div className="flex gap-1">
                  {NEXT_STATUS[viewing.status].map((s) => (
                    <Button key={s} size="sm" variant="secondary" onClick={() => handleStatusChange(s)}>{s.replace(/_/g, ' ')}</Button>
                  ))}
                </div>
              )}
            </div>
            <table className="min-w-full text-sm mb-4">
              <thead className="bg-steel-50 dark:bg-steel-800">
                <tr>{['Design', 'Qty', 'Dispatched', 'Price'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase text-steel-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-steel-100 dark:divide-steel-800">
                {viewing.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.fabric_design_name}</td>
                    <td className="px-3 py-2 tabular">{item.quantity_meters} m</td>
                    <td className="px-3 py-2 tabular">{item.quantity_dispatched_meters} m</td>
                    <td className="px-3 py-2 tabular">₹{item.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-2 rounded-md bg-steel-50 dark:bg-steel-800 p-3">
              <span className="text-sm text-steel-600 dark:text-steel-300">
                Balance due: ₹{(Number(viewing.total_amount) - Number(viewing.amount_paid)).toLocaleString()}
              </span>
              <div className="flex-1" />
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount"
                className="w-28 rounded border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-2 py-1.5 text-sm" />
              <Button size="sm" onClick={handlePayment}>Record Payment</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
