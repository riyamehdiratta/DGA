import { useEffect, useState } from 'react';
import { fetchAuditLogs, type AuditLogPage } from '@/api/admin';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField, TextInput } from '@/components/ui/FormField';

export function AdminAuditLogsPage() {
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAuditLogs({ action: action || undefined, page })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit logs'));
  }, [action, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every recorded auth, admin, and data-mutation event." />

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <div className="mb-4 w-80">
        <FormField label="Filter by action" htmlFor="audit-action-filter">
          <TextInput
            id="audit-action-filter"
            placeholder="e.g. transformer.delete"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
        </FormField>
      </div>

      <DataTable
        columns={[
          {
            key: 'createdAt',
            header: 'Time',
            render: (row) => new Date(row.createdAt).toLocaleString(),
          },
          { key: 'userEmail', header: 'User', render: (row) => row.userEmail ?? '—' },
          { key: 'action', header: 'Action', render: (row) => row.action },
          { key: 'targetType', header: 'Target Type', render: (row) => row.targetType ?? '—' },
          { key: 'targetId', header: 'Target ID', render: (row) => row.targetId ?? '—' },
        ]}
        data={data?.items ?? []}
        getRowKey={(row) => row.id}
        emptyMessage="No matching audit log entries."
      />

      {data && data.total > 0 && (
        <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages} ({data.total} entries)
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
