import { useEffect, useState } from 'react';
import { fetchSystemHealth } from '@/api/admin';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import type { SystemHealth } from '@/types';

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function AdminHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemHealth()
      .then(setHealth)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load system health'));
  }, []);

  return (
    <div>
      <PageHeader title="System Health" description="Live status of the database and API." />

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {health && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Database" value={health.database.status === 'ok' ? 'OK' : 'Error'} />
            <StatCard label="API" value={health.api.status === 'ok' ? 'OK' : 'Error'} />
            <StatCard label="DB Size" value={formatBytes(health.database.sizeBytes)} />
            <StatCard label="Uptime" value={formatUptime(health.uptimeSeconds)} />
          </div>

          <Card title="Environment">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-gray-500">App Version</dt>
              <dd className="text-gray-900">{health.appVersion}</dd>
              <dt className="text-gray-500">Node Version</dt>
              <dd className="text-gray-900">{health.nodeVersion}</dd>
              <dt className="text-gray-500">Environment</dt>
              <dd className="text-gray-900">{health.environment}</dd>
              <dt className="text-gray-500">Postgres Version</dt>
              <dd className="text-gray-900">{health.database.version ?? '—'}</dd>
            </dl>
          </Card>
        </>
      )}
    </div>
  );
}
