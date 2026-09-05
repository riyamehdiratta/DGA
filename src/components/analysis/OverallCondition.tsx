import { StatusBadge } from '@/components/ui/StatCard';
import { formatDgaStatus, parseDgaStatus } from '@/lib/analysis';
import type { AnalysisResultDetail } from '@/types';
import { TierBadge } from './badges';

interface OverallConditionProps {
  detail: AnalysisResultDetail;
}

/** Step 1 of the workflow: the transformer's condition at a glance. */
export function OverallCondition({ detail }: OverallConditionProps) {
  const { result, summary, recommendation } = detail;
  const status = parseDgaStatus(result.status);

  return (
    <section className="border border-gray-300 bg-white shadow-[0_1px_2px_rgba(28,39,51,0.05)]">
      <div className="grid grid-cols-2 divide-x divide-gray-200 lg:grid-cols-3">
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">DGA Status</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recommendation</p>
          <div className="mt-1">
            {recommendation ? (
              <TierBadge tier={recommendation.tier} />
            ) : (
              <span className="text-sm italic text-status-pending">Pending</span>
            )}
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">O₂/N₂ Ratio</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">{summary.o2n2Ratio}</p>
        </div>
      </div>
      {recommendation && recommendation.actions.length > 0 && (
        <p className="border-t border-gray-200 bg-surface px-4 py-2 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{formatDgaStatus(status)}:</span>{' '}
          {recommendation.actions[0]}
        </p>
      )}
    </section>
  );
}
