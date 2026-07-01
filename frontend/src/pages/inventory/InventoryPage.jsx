import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { inventoryApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';

const CATEGORIES = ['RAW_MATERIAL', 'YARN', 'CHEMICAL', 'SPARE_PART', 'PACKING_MATERIAL', 'FINISHED_GOODS', 'OTHER'];

const createSchema = z.object({
  itemCode: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Required'),
  category: z.enum(CATEGORIES),
  unit: z.string().min(1, 'Required'),
  openingStock: z.coerce.number().nonnegative().optional(),
  reorderLevel: z.coerce.number().nonnegative().optional(),
  unitCost: z.coerce.number().nonnegative().optional(),
  warehouseLocation: z.string().optional(),
});
const updateSchema = createSchema.omit({ itemCode: true, openingStock: true });

export default function InventoryPage() {
  const { can } = usePermission();
  const table = useDataTable(inventoryApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editing ? updateSchema : createSchema),
    defaultValues: { category: 'RAW_MATERIAL', unit: 'KG' },
  });

  function openCreate() { setEditing(null); reset({ category: 'RAW_MATERIAL', unit: 'KG' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({
      name: row.name, category: row.category, unit: row.unit, reorderLevel: row.reorder_level,
      unitCost: row.unit_cost, warehouseLocation: row.warehouse_location || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await inventoryApi.update(editing.id, values); toast.success('Item updated'); }
      else { await inventoryApi.create(values); toast.success('Inventory item created'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await inventoryApi.remove(deleting.id);
      toast.success('Item deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete item');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'item_code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    { key: 'current_stock', header: 'Stock', render: (r) => (
      <span className={Number(r.current_stock) <= Number(r.reorder_level) ? 'text-red-600 font-medium' : ''}>
        {r.current_stock} {r.unit}
      </span>
    ) },
    { key: 'reorder_level', header: 'Reorder Level' },
    { key: 'unit_cost', header: 'Unit Cost', render: (r) => `₹${r.unit_cost}` },
    {
      key: 'actions', header: '',
      render: (r) => can('inventory', 'manage') && (
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
      <PageHeader title="Inventory" description="Raw materials, yarn, chemicals, spares, and packing stock"
        action={can('inventory', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Item</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onSearch={table.handleSearch} searchPlaceholder="Search inventory…"
        filters={
          <select onChange={(e) => table.updateFilters({ category: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        }
        onExport={(fmt) => inventoryApi.download(fmt, { ...table.filters, search: table.search })}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Inventory Item'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {!editing && <Input label="Item Code" required register={register} name="itemCode" error={errors.itemCode} />}
          <Input label="Name" required register={register} name="name" error={errors.name} />
          <div className="grid grid-cols-2 gap-x-3">
            <Select label="Category" register={register} name="category" options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))} />
            <Input label="Unit" required register={register} name="unit" error={errors.unit} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            {!editing && <Input label="Opening Stock" type="number" register={register} name="openingStock" />}
            <Input label="Reorder Level" type="number" register={register} name="reorderLevel" />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Unit Cost" type="number" step="0.01" register={register} name="unitCost" />
            <Input label="Warehouse Location" register={register} name="warehouseLocation" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Item'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete item?" message={`This will permanently delete "${deleting?.name}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
