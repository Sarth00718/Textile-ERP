import { rawMaterialConsumptionApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import DataTable from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/Shared';

export default function RawMaterialConsumptionPage() {
  const table = useDataTable(rawMaterialConsumptionApi.list);

  const columns = [
    { key: 'consumption_date', header: 'Date' },
    { key: 'production_order_no', header: 'Production Order' },
    { key: 'item_name', header: 'Material' },
    { key: 'quantity_consumed', header: 'Quantity' },
    { key: 'unit', header: 'Unit' },
  ];

  return (
    <div>
      <PageHeader title="Raw Material Consumption" description="Auto-recorded whenever production entries consume inventory" />
      <DataTable columns={columns} rows={table.items} meta={table.meta} loading={table.loading} onPageChange={table.setPage} />
    </div>
  );
}
