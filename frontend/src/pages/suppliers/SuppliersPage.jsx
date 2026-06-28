import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supplierApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Textarea } from '../../components/common/FormFields';

const schema = z.object({
  supplierCode: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
});

export default function SuppliersPage() {
  const { can } = usePermission();
  const table = useDataTable(supplierApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ supplierCode: '', name: '' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({
      supplierCode: row.supplier_code, name: row.name, contactPerson: row.contact_person || '',
      phone: row.phone || '', email: row.email || '', address: row.address || '',
      gstNumber: row.gst_number || '', paymentTerms: row.payment_terms || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await supplierApi.update(editing.id, values); toast.success('Supplier updated'); }
      else { await supplierApi.create(values); toast.success('Supplier added'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await supplierApi.remove(deleting.id);
      toast.success('Supplier deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete supplier');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'supplier_code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'contact_person', header: 'Contact', render: (r) => r.contact_person || '—' },
    { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
    { key: 'rating', header: 'Rating', render: (r) => `${r.rating || 0}/5` },
    {
      key: 'actions', header: '',
      render: (r) => can('suppliers', 'manage') && (
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
      <PageHeader title="Suppliers" description="Raw material and supply vendors"
        action={can('suppliers', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Supplier</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onSearch={table.handleSearch} searchPlaceholder="Search suppliers…"
        onExport={(fmt) => window.open(supplierApi.exportUrl(fmt))}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Supplier Code" required register={register} name="supplierCode" error={errors.supplierCode} />
            <Input label="Name" required register={register} name="name" error={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Contact Person" register={register} name="contactPerson" />
            <Input label="Phone" register={register} name="phone" />
          </div>
          <Input label="Email" register={register} name="email" error={errors.email} />
          <Textarea label="Address" register={register} name="address" />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="GST Number" register={register} name="gstNumber" />
            <Input label="Payment Terms" register={register} name="paymentTerms" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Supplier'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete supplier?" message={`This will permanently delete "${deleting?.name}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
