import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import { qualityControlApi, fabricRollApi, employeeApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { PageHeader, Button } from '../../components/common/Shared';
import { Select, Input, Textarea } from '../../components/common/FormFields';
import StatusBadge from '../../components/common/StatusBadge';

const RESULTS = [{ value: 'PASS', label: 'Pass' }, { value: 'FAIL', label: 'Fail' }, { value: 'REWORK', label: 'Rework' }];

const schema = z.object({
  fabricRollId: z.string().min(1, 'Select a fabric roll'),
  inspectedBy: z.string().optional(),
  result: z.enum(['PASS', 'FAIL', 'REWORK']),
  defectType: z.string().optional(),
  defectPoints: z.coerce.number().int().nonnegative().optional(),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

export default function QualityControlPage() {
  const { can } = usePermission();
  const table = useDataTable(qualityControlApi.list);
  const [rolls, setRolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { result: 'PASS' } });

  useEffect(() => {
    fabricRollApi.list({ status: 'PRODUCED', pageSize: 100 }).then((res) => setRolls(res.items || []));
    employeeApi.list({ pageSize: 200 }).then((res) => setEmployees(res.items || []));
  }, [modalOpen]);

  async function onSubmit(values) {
    try {
      await qualityControlApi.create(values);
      toast.success('Inspection recorded — roll status updated');
      setModalOpen(false);
      table.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record inspection');
    }
  }

  const columns = [
    { key: 'roll_no', header: 'Roll' },
    { key: 'inspector_name', header: 'Inspector', render: (r) => r.inspector_name || '—' },
    { key: 'inspection_date', header: 'Date', render: (r) => new Date(r.inspection_date).toLocaleString() },
    { key: 'result', header: 'Result', render: (r) => <StatusBadge status={r.result} /> },
    { key: 'grade', header: 'Grade', render: (r) => r.grade || '—' },
    { key: 'defect_type', header: 'Defect', render: (r) => r.defect_type || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Quality Control"
        description="Inspect produced rolls — a Pass result enables packing, a Fail blocks it"
        action={can('qualityControl', 'manage') && <Button onClick={() => { reset({ result: 'PASS' }); setModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Record Inspection</Button>}
      />

      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage}
        filters={
          <select onChange={(e) => table.updateFilters({ result: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All results</option>
            <option value="PASS">Pass</option><option value="FAIL">Fail</option><option value="REWORK">Rework</option>
          </select>
        }
        onExport={(fmt) => qualityControlApi.download(fmt, { ...table.filters })}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select label="Fabric Roll" required register={register} name="fabricRollId" placeholder="Select roll" error={errors.fabricRollId}
            options={rolls.map((r) => ({ value: r.id, label: r.roll_no }))} />
          <Select label="Inspector" register={register} name="inspectedBy" placeholder="Unassigned"
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
          <Select label="Result" required register={register} name="result" options={RESULTS} />
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Defect Type" register={register} name="defectType" />
            <Input label="Grade" register={register} name="grade" />
          </div>
          <Input label="Defect Points" type="number" register={register} name="defectPoints" />
          <Textarea label="Remarks" register={register} name="remarks" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
