import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { packingApi, fabricRollApi, employeeApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Select, Input } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const schema = z.object({
  fabricRollId: z.string().min(1, 'Select a QC-passed roll'),
  packedBy: z.string().optional(),
  packageWeightKg: z.coerce.number().positive().optional(),
  packageType: z.string().optional(),
});

export default function PackingPage() {
  const { can } = usePermission();
  const table = useDataTable(packingApi.list);
  const [rolls, setRolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    fabricRollApi.list({ status: 'QC_PASSED', pageSize: 100 }).then((res) => setRolls(res.items || []));
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
  }, [modalOpen]);

  async function onSubmit(values) {
    try {
      await packingApi.create(values);
      toast.success('Roll packed — ready for dispatch');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not pack roll');
    }
  }

  const columns = [
    { key: 'package_no', header: 'Package No' },
    { key: 'roll_no', header: 'Roll' },
    { key: 'length_meters', header: 'Length (m)' },
    { key: 'package_weight_kg', header: 'Weight (kg)', render: (r) => r.package_weight_kg || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'packed_at', header: 'Packed', render: (r) => new Date(r.packed_at).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader
        title="Packing"
        description="Pack QC-passed rolls — packing makes them eligible for dispatch"
        action={can('packing', 'manage') && <Button onClick={() => { reset(); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Pack a Roll</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        onExport={(fmt) => packingApi.download(fmt, {})} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pack a Roll">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Fabric Roll (QC Passed)" required register={register} name="fabricRollId" placeholder="Select roll" error={errors.fabricRollId}
            options={rolls.map((r) => ({ value: r.id, label: `${r.roll_no} (${r.length_meters} m)` }))} />
          <Select label="Packed By" register={register} name="packedBy" placeholder="Unassigned"
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Package Weight (kg)" type="number" register={register} name="packageWeightKg" />
            <Input label="Package Type" register={register} name="packageType" placeholder="ROLL_BAG" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Pack</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
