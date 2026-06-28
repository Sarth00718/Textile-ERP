import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { customerApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Textarea } from '../../components/common/FormFields';

const schema = z.object({
  customerCode: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  creditLimit: z.coerce.number().nonnegative().optional(),
  paymentTerms: z.string().optional(),
});

export default function CustomersPage() {
  const { can } = usePermission();
  const table = useDataTable(customerApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ customerCode: '', name: '' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({
      customerCode: row.customer_code, name: row.name, contactPerson: row.contact_person || '',
      phone: row.phone || '', email: row.email || '', billingAddress: row.billing_address || '',
      shippingAddress: row.shipping_address || '', gstNumber: row.gst_number || '',
      creditLimit: row.credit_limit, paymentTerms: row.payment_terms || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await customerApi.update(editing.id, values); toast.success('Customer updated'); }
      else { await customerApi.create(values); toast.success('Customer added'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await customerApi.remove(deleting.id);
      toast.success('Customer deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete customer');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'customer_code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'contact_person', header: 'Contact', render: (r) => r.contact_person || '—' },
    { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
    { key: 'credit_limit', header: 'Credit Limit', render: (r) => `₹${Number(r.credit_limit).toLocaleString()}` },
    {
      key: 'actions', header: '',
      render: (r) => can('customers', 'manage') && (
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
      <PageHeader title="Customers" description="Buyers of finished fabric"
        action={can('customers', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Customer</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onSearch={table.handleSearch} searchPlaceholder="Search customers…"
        onExport={(fmt) => window.open(customerApi.exportUrl(fmt))}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Customer Code" required register={register} name="customerCode" error={errors.customerCode} />
            <Input label="Name" required register={register} name="name" error={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Contact Person" register={register} name="contactPerson" />
            <Input label="Phone" register={register} name="phone" />
          </div>
          <Input label="Email" register={register} name="email" error={errors.email} />
          <Textarea label="Billing Address" register={register} name="billingAddress" />
          <Textarea label="Shipping Address" register={register} name="shippingAddress" />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="GST Number" register={register} name="gstNumber" />
            <Input label="Credit Limit" type="number" register={register} name="creditLimit" />
          </div>
          <Input label="Payment Terms" register={register} name="paymentTerms" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete customer?" message={`This will permanently delete "${deleting?.name}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
