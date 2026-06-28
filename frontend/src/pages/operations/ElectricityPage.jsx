import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { electricityApi, departmentApi, machineApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';

const schema = z.object({
  readingDate: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  machineId: z.string().optional(),
  meterReading: z.coerce.number().nonnegative(),
  unitsConsumed: z.coerce.number().nonnegative(),
});

export default function ElectricityPage() {
  const { can } = usePermission();
  const table = useDataTable(electricityApi.list);
  const [departments, setDepartments] = useState([]);
  const [machines, setMachines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { readingDate: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    departmentApi.list({ pageSize: 100 }).then((res) => setDepartments(res.items || []));
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
  }, []);

  async function onSubmit(values) {
    try {
      await electricityApi.create(values);
      toast.success('Reading recorded');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record reading');
    }
  }

  const columns = [
    { key: 'reading_date', header: 'Date' },
    { key: 'department_name', header: 'Department', render: (r) => r.department_name || '—' },
    { key: 'machine_name', header: 'Machine', render: (r) => r.machine_name || '—' },
    { key: 'units_consumed', header: 'Units (kWh)' },
    { key: 'cost_amount', header: 'Cost', render: (r) => `₹${Number(r.cost_amount).toLocaleString()}` },
  ];

  return (
    <div>
      <PageHeader title="Electricity Monitoring" description="Power consumption tracking by department/machine"
        action={can('electricityMonitoring', 'manage') && <Button onClick={() => { reset({ readingDate: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Log Reading</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onExport={(fmt) => window.open(electricityApi.list ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/operations/electricity?format=${fmt}` : undefined)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Electricity Reading">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Date" type="date" required register={register} name="readingDate" error={errors.readingDate} />
          <div className="grid grid-cols-2 gap-x-3">
            <Select label="Department" register={register} name="departmentId" placeholder="None" options={departments.map((d) => ({ value: d.id, label: d.name }))} />
            <Select label="Machine" register={register} name="machineId" placeholder="None" options={machines.map((m) => ({ value: m.id, label: m.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Meter Reading" type="number" required register={register} name="meterReading" error={errors.meterReading} />
            <Input label="Units Consumed (kWh)" type="number" required register={register} name="unitsConsumed" error={errors.unitsConsumed} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
