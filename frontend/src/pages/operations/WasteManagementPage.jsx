import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { wasteApi, machineApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Input, Select, Textarea } from '../../components/common/FormFields';

const WASTE_TYPES = [
  { value: 'YARN_WASTE', label: 'Yarn Waste' }, { value: 'FABRIC_WASTE', label: 'Fabric Waste' },
  { value: 'PROCESS_WASTE', label: 'Process Waste' }, { value: 'OTHER', label: 'Other' },
];

const schema = z.object({
  wasteDate: z.string().optional(),
  wasteType: z.enum(['YARN_WASTE', 'FABRIC_WASTE', 'PROCESS_WASTE', 'OTHER']),
  sourceMachineId: z.string().optional(),
  quantityKg: z.coerce.number().positive('Must be positive'),
  disposalMethod: z.string().optional(),
  recoveryValue: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export default function WasteManagementPage() {
  const { can } = usePermission();
  const table = useDataTable(wasteApi.list);
  const [machines, setMachines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { wasteType: 'YARN_WASTE', wasteDate: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    machineApi.list({ pageSize: 200 }).then((res) => setMachines(res.items || []));
  }, []);

  async function onSubmit(values) {
    try {
      await wasteApi.create(values);
      toast.success('Waste record logged');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not log waste record');
    }
  }

  const columns = [
    { key: 'waste_date', header: 'Date' },
    { key: 'waste_type', header: 'Type' },
    { key: 'machine_name', header: 'Source Machine', render: (r) => r.machine_name || '—' },
    { key: 'quantity_kg', header: 'Quantity (kg)' },
    { key: 'recovery_value', header: 'Recovery Value', render: (r) => `₹${Number(r.recovery_value || 0).toLocaleString()}` },
  ];

  return (
    <div>
      <PageHeader title="Waste Management" description="Yarn, fabric, and process waste tracking"
        action={can('wasteManagement', 'manage') && <Button onClick={() => { reset({ wasteType: 'YARN_WASTE', wasteDate: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Log Waste</Button>} />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onExport={(fmt) => window.open(wasteApi.list ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/operations/waste?format=${fmt}` : undefined)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Waste Record">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Date" type="date" register={register} name="wasteDate" />
            <Select label="Type" required register={register} name="wasteType" options={WASTE_TYPES} />
          </div>
          <Select label="Source Machine" register={register} name="sourceMachineId" placeholder="None" options={machines.map((m) => ({ value: m.id, label: m.name }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Quantity (kg)" type="number" required register={register} name="quantityKg" error={errors.quantityKg} />
            <Input label="Recovery Value" type="number" register={register} name="recoveryValue" />
          </div>
          <Input label="Disposal Method" register={register} name="disposalMethod" />
          <Textarea label="Notes" register={register} name="notes" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
