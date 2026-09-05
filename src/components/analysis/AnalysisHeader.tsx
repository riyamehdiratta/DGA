import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { parseDgaStatus } from '@/lib/analysis';
import type { AnalysisResultDetail } from '@/types';
import { TierBadge } from './badges';

interface AnalysisHeaderProps {
  detail: AnalysisResultDetail;
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="truncate text-sm font-medium tabular-nums text-gray-900" title={value}>
        {value}
      </p>
    </div>
  );
}

/**
 * Compact engineering dashboard header: identity, dates, verdicts, and
 * actions in two dense rows instead of the old whitespace-heavy layout.
 */
export function AnalysisHeader({ detail }: AnalysisHeaderProps) {
  const { result, transformer, sample } = detail;
  const reportId = result.id.replace('AN-', 'RPT-');

  return (
    <header className="mb-4 border border-gray-300 bg-white shadow-[0_1px_2px_rgba(28,39,51,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <h1 className="text-base font-bold text-gray-900">{transformer.transformerName}</h1>
          <span className="text-sm text-gray-600">
            {transformer.voltageRating} · {transformer.substation}
          </span>
        </div>
        <div className="no-print flex items-center gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
          <Link to={`/reports/${reportId}`}>
            <Button variant="secondary">Export Report</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => window.location.assign(`/api/analysis/${result.id}/export/xlsx`)}
          >
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <MetaCell label="Analysis ID" value={result.id} />
        <MetaCell label="Sample Date" value={sample.sampleDate} />
        <MetaCell label="Analyzed" value={result.createdAt.split('T')[0]} />
        <MetaCell label="MVA Rating" value={transformer.mvaRating} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Overall Status</p>
          <div className="mt-0.5">
            <StatusBadge status={parseDgaStatus(result.status)} />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recommendation</p>
          <div className="mt-0.5">
            {detail.recommendation ? (
              <TierBadge tier={detail.recommendation.tier} />
            ) : (
              <span className="text-sm italic text-status-pending">Pending</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
