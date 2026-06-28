import { auditLogApi } from '../../api/services';
import { useDataTable } from '../../hooks/useDataTable';
import DataTable from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/Shared';

export default function AuditLogsPage() {
  const table = useDataTable(auditLogApi.list);

  const columns = [
    { key: 'created_at', header: 'Timestamp', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'user_name', header: 'User', render: (r) => r.user_name || 'System' },
    { key: 'action', header: 'Action' },
    { key: 'entity_type', header: 'Entity Type' },
    { key: 'entity_id', header: 'Entity ID', render: (r) => r.entity_id ? r.entity_id.slice(0, 8) : '—' },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" description="Full history of create/update/delete actions across the system" />
      <DataTable
        columns={columns}
        rows={table.items}
        meta={table.meta}
        loading={table.loading}
        onPageChange={table.setPage}
        onExport={(fmt) => window.open(auditLogApi.list ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/audit-logs?format=${fmt}` : undefined)}
      />
    </div>
  );
}
