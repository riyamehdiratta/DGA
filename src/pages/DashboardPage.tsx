import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import type { AnalysisHistoryRow } from '@/types';

const columns = [
  {
    key: 'date',
    header: 'Date',
    render: (row: AnalysisHistoryRow) => row.date,
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
      <span className="text-gray-600">{row.diagnosis}</span>
    ),
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { getDashboardStats, getAnalysisHistory } = useAppState();
  const stats = getDashboardStats();
  const recent = getAnalysisHistory().slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Laboratory overview — transformer fleet monitoring and recent DGA activity."
      />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Registered Transformers" value={stats.totalTransformers} />
        <StatCard label="Samples This Month" value={stats.samplesThisMonth} />
        <StatCard label="Pending Review" value={stats.pendingReview} />
        <StatCard
          label="Critical Alerts"
          value={stats.criticalAlerts}
          sublabel="Requires immediate attention"
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Recent Analyses</h2>
        <div className="flex gap-2">
          <Link to="/analysis/new">
            <Button>New Analysis</Button>
          </Link>
          <Link to="/analysis/history">
            <Button variant="secondary">View All History</Button>
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={recent}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/analysis/${row.id}`)}
        emptyMessage="No analyses recorded yet."
      />
    </div>
  );
}
