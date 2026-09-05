import { useEffect, useState } from 'react';
import { fetchAdminDashboard } from '@/api/admin';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import type { AdminDashboardData } from '@/types';

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'));
  }, []);

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="System-wide overview." />

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Transformers" value={data.counts.transformers} />
            <StatCard label="Samples" value={data.counts.samples} />
            <StatCard label="Analyses" value={data.counts.analyses} />
            <StatCard label="Users" value={data.counts.users} />
          </div>

          <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Activity</h2>
          <DataTable
            columns={[
              {
                key: 'createdAt',
                header: 'Time',
                render: (row) => new Date(row.createdAt).toLocaleString(),
              },
              { key: 'userEmail', header: 'User', render: (row) => row.userEmail ?? '—' },
              { key: 'action', header: 'Action', render: (row) => row.action },
              { key: 'target', header: 'Target', render: (row) => row.targetType ?? '—' },
            ]}
            data={data.recentActivity}
            getRowKey={(row) => row.id}
            emptyMessage="No activity yet."
          />
        </>
      )}
    </div>
  );
}
