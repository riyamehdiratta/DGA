import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatCard';
import { TextInput } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { formatDgaStatus } from '@/lib/analysis';
import type { AnalysisHistoryRow, DgaStatus } from '@/types';

const statusOptions: (DgaStatus | '')[] = ['', 'STATUS_1', 'STATUS_2', 'STATUS_3'];

export function AnalysisHistoryPage() {
  const navigate = useNavigate();
  const { getAnalysisHistory, getSubstations } = useAppState();
  const history = getAnalysisHistory();
  const substations = getSubstations();

  const [search, setSearch] = useState('');
  const [substationFilter, setSubstationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<DgaStatus | ''>('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return history.filter((record) => {
      const matchesSearch =
        !q ||
        record.transformerName.toLowerCase().includes(q) ||
        record.id.toLowerCase().includes(q) ||
        record.diagnosis.toLowerCase().includes(q);
      const matchesSubstation =
        !substationFilter || record.substation === substationFilter;
      const matchesStatus = !statusFilter || record.status === statusFilter;
      return matchesSearch && matchesSubstation && matchesStatus;
    });
  }, [history, search, substationFilter, statusFilter]);

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: AnalysisHistoryRow) => (
        <span className="whitespace-nowrap tabular-nums">{row.date}</span>
      ),
    },
    {
      key: 'transformer',
      header: 'Transformer',
      render: (row: AnalysisHistoryRow) => (
        <Link
          to={`/transformers/${row.transformerId}`}
          className="font-medium text-gray-900 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.transformerName}
        </Link>
      ),
    },
    {
      key: 'substation',
      header: 'Substation',
      render: (row: AnalysisHistoryRow) => row.substation,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: AnalysisHistoryRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      render: (row: AnalysisHistoryRow) => (
        <span className="text-gray-700">{row.diagnosis}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Analysis History"
        description="Complete record of all DGA analyses performed in the laboratory."
      />

      <div className="mb-4 flex items-end gap-4 border border-gray-300 bg-gray-50 p-4">
        <div className="flex-1">
          <label htmlFor="history-search" className="mb-1 block text-xs font-medium text-gray-700">
            Search
          </label>
          <TextInput
            id="history-search"
            placeholder="Search by transformer, analysis ID, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <label htmlFor="history-substation" className="mb-1 block text-xs font-medium text-gray-700">
            Substation
          </label>
          <select
            id="history-substation"
            value={substationFilter}
            onChange={(e) => setSubstationFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {substations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label htmlFor="history-status" className="mb-1 block text-xs font-medium text-gray-700">
            Status
          </label>
          <select
            id="history-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DgaStatus | '')}
            className="w-full px-3 py-2 text-sm"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s ? formatDgaStatus(s) : 'All'}</option>
            ))}
          </select>
        </div>
        {(search || substationFilter || statusFilter) && (
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setSubstationFilter('');
              setStatusFilter('');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        <Link to="/analysis/new">
          <Button>New Analysis</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/analysis/${row.id}`)}
        emptyMessage="No analyses match your filters."
      />
    </div>
  );
}
