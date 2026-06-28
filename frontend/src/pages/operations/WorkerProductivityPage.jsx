import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { productivityApi, employeeApi, machineApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select } from '../../components/common/FormFields';

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  productionDate: z.string().min(1, 'Required'),
  machineId: z.string().optional(),
  quantityProducedMeters: z.coerce.number().nonnegative().optional(),
  hoursWorked: z.coerce.number().nonnegative().optional(),
  defectCount: z.coerce.number().int().nonnegative().optional(),
});

export default function WorkerProductivityPage() {
  const { can } = usePermission();
  const table = useDataTable(productivityApi.list);
  const [employees, setEmployees] = useState([]);
  const [machines, setMachines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { productionDate: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
  }, []);

  async function onSubmit(values) {
    try {
      await productivityApi.create(values);
      toast.success('Productivity recorded');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record productivity');
    }
  }

  const columns = [
    { key: 'production_date', header: 'Date' },
    { key: 'employee_name', header: 'Employee' },
    { key: 'machine_name', header: 'Machine', render: (r) => r.machine_name || '—' },
    { key: 'quantity_produced_meters', header: 'Produced (m)' },
    { key: 'hours_worked', header: 'Hours' },
    { key: 'efficiency_percent', header: 'Efficiency (m/hr)' },
    { key: 'defect_count', header: 'Defects' },
  ];

  return (
    <div>
      <PageHeader title="Worker Productivity" description="Per-employee output and efficiency tracking"
        action={can('workerProductivity', 'manage') && <Button onClick={() => { reset({ productionDate: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Record Productivity</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Worker Productivity">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Employee" required register={register} name="employeeId" placeholder="Select employee" error={errors.employeeId}
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Date" type="date" required register={register} name="productionDate" error={errors.productionDate} />
            <Select label="Machine" register={register} name="machineId" placeholder="None" options={machines.map((m) => ({ value: m.id, label: m.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Quantity Produced (m)" type="number" register={register} name="quantityProducedMeters" />
            <Input label="Hours Worked" type="number" step="0.5" register={register} name="hoursWorked" />
          </div>
          <Input label="Defect Count" type="number" register={register} name="defectCount" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
