import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { waterApi, departmentApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';

const schema = z.object({
  readingDate: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  meterReading: z.coerce.number().nonnegative(),
  unitsConsumed: z.coerce.number().nonnegative(),
});

export default function WaterPage() {
  const { can } = usePermission();
  const table = useDataTable(waterApi.list);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { readingDate: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    departmentApi.list({ pageSize: 100 }).then((res) => setDepartments(res.items || []));
  }, []);

  async function onSubmit(values) {
    try {
      await waterApi.create(values);
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
    { key: 'units_consumed', header: 'Units' },
    { key: 'cost_amount', header: 'Cost', render: (r) => `₹${Number(r.cost_amount).toLocaleString()}` },
  ];

  return (
    <div>
      <PageHeader title="Water Monitoring" description="Water consumption tracking by department"
        action={can('waterMonitoring', 'manage') && <Button onClick={() => { reset({ readingDate: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Log Reading</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Water Reading">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Date" type="date" required register={register} name="readingDate" error={errors.readingDate} />
          <Select label="Department" register={register} name="departmentId" placeholder="None" options={departments.map((d) => ({ value: d.id, label: d.name }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Meter Reading" type="number" required register={register} name="meterReading" error={errors.meterReading} />
            <Input label="Units Consumed" type="number" required register={register} name="unitsConsumed" error={errors.unitsConsumed} />
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
