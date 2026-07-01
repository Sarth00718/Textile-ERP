import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { expenseApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';

const CATEGORIES = ['RAW_MATERIAL', 'UTILITY', 'SALARY', 'MAINTENANCE', 'TRANSPORT', 'ADMIN', 'OTHER'];

const schema = z.object({
  category: z.enum(CATEGORIES),
  description: z.string().min(2, 'Required'),
  amount: z.coerce.number().positive('Must be positive'),
  expenseDate: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export default function ExpensesPage() {
  const { can } = usePermission();
  const table = useDataTable(expenseApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { category: 'OTHER' } });

  function openCreate() { setEditing(null); reset({ category: 'OTHER', expenseDate: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({ category: row.category, description: row.description, amount: row.amount, expenseDate: row.expense_date?.slice(0, 10), paymentMethod: row.payment_method });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await expenseApi.update(editing.id, values); toast.success('Expense updated'); }
      else { await expenseApi.create(values); toast.success('Expense recorded'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await expenseApi.remove(deleting.id);
      toast.success('Expense deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete expense');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'expense_no', header: 'Expense No' },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Amount', render: (r) => `₹${Number(r.amount).toLocaleString()}` },
    { key: 'expense_date', header: 'Date' },
    {
      key: 'actions', header: '',
      render: (r) => can('expenses', 'manage') && (
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
      <PageHeader title="Expense Management" description="Operating expenses by category"
        action={can('expenses', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Expense</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        filters={
          <select onChange={(e) => table.updateFilters({ category: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        }
        onExport={(fmt) => expenseApi.download(fmt, { ...table.filters })}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Category" required register={register} name="category" options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))} />
          <Input label="Description" required register={register} name="description" error={errors.description} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Amount" type="number" step="0.01" required register={register} name="amount" error={errors.amount} />
            <Input label="Date" type="date" register={register} name="expenseDate" />
          </div>
          <Input label="Payment Method" register={register} name="paymentMethod" placeholder="BANK_TRANSFER" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete expense?" message="This will permanently delete this expense record."
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
