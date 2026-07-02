import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { vehicleApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button, ConfirmDialog } from '../../components/common/Shared';
import { Input } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  vehicleNumber: z.string().min(1, 'Required'),
  vehicleType: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  capacityKg: z.coerce.number().positive().optional(),
});

export default function VehiclesPage() {
  const { can } = usePermission();
  const table = useDataTable(vehicleApi.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ vehicleNumber: '' }); setModalOpen(true); }
  function openEdit(row) {
    setEditing(row);
    reset({ vehicleNumber: row.vehicle_number, vehicleType: row.vehicle_type || '', driverName: row.driver_name || '', driverPhone: row.driver_phone || '', capacityKg: row.capacity_kg || '' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await vehicleApi.update(editing.id, values); toast.success('Vehicle updated'); }
      else { await vehicleApi.create(values); toast.success('Vehicle added'); }
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function confirmDelete() {
    try {
      await vehicleApi.remove(deleting.id);
      toast.success('Vehicle deleted');
      setDeleting(null);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete vehicle');
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'vehicle_number', header: 'Vehicle No' },
    { key: 'vehicle_type', header: 'Type', render: (r) => r.vehicle_type || '—' },
    { key: 'driver_name', header: 'Driver', render: (r) => r.driver_name || '—' },
    { key: 'capacity_kg', header: 'Capacity (kg)', render: (r) => r.capacity_kg || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      render: (r) => can('vehicles', 'manage') && (
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
      <PageHeader title="Vehicle Management" description="Fleet for outbound dispatch"
        action={can('vehicles', 'manage') && <Button onClick={openCreate}><PlusIcon className="h-4 w-4" /> Add Vehicle</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onSearch={table.handleSearch} searchPlaceholder="Search vehicles…"
        filters={
          <select onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        }
        onExport={(fmt) => vehicleApi.download(fmt, { ...table.filters, search: table.search })} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Vehicle Number" required register={register} name="vehicleNumber" error={errors.vehicleNumber} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Type" register={register} name="vehicleType" />
            <Input label="Capacity (kg)" type="number" register={register} name="capacityKg" />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Driver Name" register={register} name="driverName" />
            <Input label="Driver Phone" register={register} name="driverPhone" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Vehicle'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete vehicle?" message={`This will permanently delete "${deleting?.vehicle_number}".`}
        onConfirm={confirmDelete} onCancel={() => setDeleting(null)} confirmLabel="Delete" danger />
    </div>
  );
}
