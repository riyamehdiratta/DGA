import { useEffect, useState } from 'react';
import { createBackup, downloadBackup, fetchBackups } from '@/api/admin';
import { ApiError } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import type { BackupFile } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminBackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    fetchBackups()
      .then(setBackups)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load backups'));
  }

  useEffect(load, []);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const backup = await createBackup();
      setBackups((prev) => [backup, ...prev]);
      await downloadBackup(backup.filename);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader title="Backup" description="Create and download database backups." />

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Creates a full database dump and downloads it to your browser immediately.
          </p>
          <Button type="button" onClick={() => void handleCreate()} disabled={creating}>
            {creating ? 'Creating backup...' : 'Create & Download Backup'}
          </Button>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Available Backups</h2>
      <DataTable
        columns={[
          { key: 'filename', header: 'File', render: (b) => b.filename },
          { key: 'size', header: 'Size', render: (b) => formatBytes(b.sizeBytes) },
          {
            key: 'createdAt',
            header: 'Created',
            render: (b) => new Date(b.createdAt).toLocaleString(),
          },
          {
            key: 'actions',
            header: '',
            render: (b) => (
              <button
                type="button"
                className="cursor-pointer text-xs text-gray-600 underline hover:text-gray-900"
                onClick={() => void downloadBackup(b.filename)}
              >
                Download
              </button>
            ),
          },
        ]}
        data={backups}
        getRowKey={(b) => b.filename}
        emptyMessage="No backups yet."
      />

      <Card title="Restoring a backup" className="mt-6">
        <p className="text-sm text-gray-700">
          Restoring the database is not available from this page — it is a deliberately
          out-of-band operation performed on the server itself, so a compromised or
          misclicked browser session can never overwrite production data.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          <li>Copy the desired backup file to the machine running Postgres.</li>
          <li>
            Restore it directly against the database, e.g.
            {' '}
            <code className="bg-gray-100 px-1 py-0.5 text-xs">
              psql -U dga -d dga_analysis -f backup.sql
            </code>
            .
          </li>
        </ol>
      </Card>
    </div>
  );
}
