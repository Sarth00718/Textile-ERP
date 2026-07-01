import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { departmentApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Textarea } from '../../components/common/FormFields';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required'),
  description: z.string().optional(),
});

export default function DepartmentsPage() {
  const { can } = usePermission();
  const table = useDataTable(departmentApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  function openCreate() {
    setEditing(null);
    reset({ name: '', code: '', description: '' });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    reset({ name: row.name, code: row.code, description: row.description || '' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await departmentApi.update(editing.id, values);
        toast.success('Department updated');
      } else {
        await departmentApi.create(values);
        toast.success('Department created');
      }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await departmentApi.remove(deleting.id);
      toast.success('Department deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete department');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    { key: 'parent_department_name', header: 'Parent', render: (r) => r.parent_department_name || '—' },
    { key: 'is_active', header: 'Status', render: (r) => (r.is_active ? 'Active' : 'Inactive') },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        can('departments', 'manage') && (
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
      <PageHeader
        title="Departments"
        description="Organizational units within the factory"
        action={can('departments', 'manage') && (
          <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> New Department</Button>
        )}
      />

      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        onSearch={table.handleSearch}
        searchPlaceholder="Search departments…"
        onExport={(fmt) => departmentApi.download(fmt, { search: table.search })}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'New Department'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Name" required register={register} name="name" error={errors.name} />
          <Input label="Code" required register={register} name="code" error={errors.code} />
          <Textarea label="Description" register={register} name="description" error={errors.description} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Department'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete department?"
        message={`This will permanently delete "${deleting?.name}". This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
