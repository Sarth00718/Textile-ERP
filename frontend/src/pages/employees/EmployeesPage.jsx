import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { employeeApi, departmentApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input, Select, Checkbox } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  dateOfJoining: z.string().optional(),
  salaryType: z.enum(['MONTHLY', 'DAILY', 'PIECE_RATE']).optional(),
  baseSalary: z.coerce.number().nonnegative().optional(),
  createUserAccount: z.boolean().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  userPassword: z.string().optional(),
  userRole: z.enum(['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER', 'ACCOUNTANT']).optional(),
});

export default function EmployeesPage() {
  const { can } = usePermission();
  const table = useDataTable(employeeApi.list);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const createUserAccount = watch('createUserAccount');

  useEffect(() => {
    departmentApi.list({ pageSize: 100 }).then((res) => setDepartments(res.items || []));
  }, []);

  function openCreate() {
    setEditing(null);
    reset({ fullName: '', salaryType: 'MONTHLY', baseSalary: 0, createUserAccount: false });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    reset({
      fullName: row.full_name, phone: row.phone || '', email: row.email || '',
      departmentId: row.department_id || '', designation: row.designation || '',
      dateOfJoining: row.date_of_joining?.slice(0, 10), salaryType: row.salary_type,
      baseSalary: row.base_salary,
    });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await employeeApi.update(editing.id, values);
        toast.success('Employee updated');
      } else {
        await employeeApi.create(values);
        toast.success('Employee added');
      }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await employeeApi.remove(deleting.id);
      toast.success('Employee removed');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete employee');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'employee_code', header: 'Code' },
    { key: 'full_name', header: 'Name' },
    { key: 'department_name', header: 'Department', render: (r) => r.department_name || '—' },
    { key: 'designation', header: 'Designation', render: (r) => r.designation || '—' },
    { key: 'employment_status', header: 'Status', render: (r) => <StatusBadge status={r.employment_status} /> },
    {
      key: 'actions', header: '',
      render: (r) => can('employees', 'manage') && (
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
        title="Employees"
        description="Factory workforce records"
        action={can('employees', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Employee</Button>}
      />

      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        onSearch={table.handleSearch}
        searchPlaceholder="Search employees…"
        onExport={(fmt) => employeeApi.download(fmt, { search: table.search })}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Full Name" required register={register} name="fullName" error={errors.fullName} />
            <Input label="Phone" register={register} name="phone" error={errors.phone} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Email" register={register} name="email" error={errors.email} />
            <Input label="Designation" register={register} name="designation" error={errors.designation} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Select label="Department" register={register} name="departmentId" placeholder="Select department"
              options={departments.map((d) => ({ value: d.id, label: d.name }))} />
            <Input label="Date of Joining" type="date" register={register} name="dateOfJoining" />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Select label="Salary Type" register={register} name="salaryType"
              options={[{ value: 'MONTHLY', label: 'Monthly' }, { value: 'DAILY', label: 'Daily' }, { value: 'PIECE_RATE', label: 'Piece Rate' }]} />
            <Input label="Base Salary" type="number" step="0.01" register={register} name="baseSalary" />
          </div>

          {!editing && (
            <>
              <Checkbox label="Also create a login account for this employee" register={register} name="createUserAccount" />
              {createUserAccount && (
                <div className="grid grid-cols-2 gap-x-3 rounded-md bg-steel-50 dark:bg-steel-800 p-3">
                  <Input label="Login Email" register={register} name="userEmail" error={errors.userEmail} />
                  <Input label="Temporary Password" type="password" register={register} name="userPassword" />
                  <Select label="Role" register={register} name="userRole"
                    options={[
                      { value: 'MANAGER', label: 'Manager' }, { value: 'SUPERVISOR', label: 'Supervisor' },
                      { value: 'WORKER', label: 'Worker' }, { value: 'ACCOUNTANT', label: 'Accountant' },
                    ]} />
                </div>
              )}
            </>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Employee'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove employee?"
        message={`This will permanently remove "${deleting?.full_name}" from the system.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
