import { fabricRollApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import DataTable from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/Shared';
import StatusBadge from '../../components/common/StatusBadge';

export default function FabricRollsPage() {
  const table = useDataTable(fabricRollApi.list);

  const columns = [
    { key: 'roll_no', header: 'Roll No' },
    { key: 'fabric_design_name', header: 'Fabric Design' },
    { key: 'production_order_no', header: 'Production Order' },
    { key: 'length_meters', header: 'Length (m)' },
    { key: 'weight_kg', header: 'Weight (kg)', render: (r) => r.weight_kg || '—' },
    { key: 'warehouse_location', header: 'Location', render: (r) => r.warehouse_location || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Fabric Roll Management"
        description="Finished rolls move through QC, packing, and dispatch in sequence"
      />

      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        onSearch={table.handleSearch}
        searchPlaceholder="Search by roll number…"
        filters={
          <select onChange={(e) => table.updateFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 px-2.5 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="PRODUCED">Produced</option><option value="IN_QC">In QC</option>
            <option value="QC_PASSED">QC Passed</option><option value="QC_FAILED">QC Failed</option>
            <option value="PACKED">Packed</option><option value="DISPATCHED">Dispatched</option>
          </select>
        }
        onExport={(fmt) => window.open(fabricRollApi.exportUrl(fmt))}
      />
    </div>
  );
}
