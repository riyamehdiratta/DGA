import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatCard';
import { parseDgaStatus } from '@/lib/analysis';
import type { AnalysisResultDetail } from '@/types';
import { TierBadge } from './badges';

interface RecommendationPlanProps {
  detail: AnalysisResultDetail;
}

/** Step 6 of the workflow: the recommendation as an engineer's action plan. */
export function RecommendationPlan({ detail }: RecommendationPlanProps) {
  const recommendation = detail.recommendation;
  const { result } = detail;

  if (!recommendation) {
    return (
      <Card title="Recommendation">
        <p className="text-sm italic text-status-pending">
          No recommendation is stored for this analysis.
        </p>
      </Card>
    );
  }

  const evidence: { label: string; value: string }[] = [];
  if (result.status) evidence.push({ label: 'DGA Status', value: result.status });
  const t1 = result.duvalTriangleResult?.triangle1.zone;
  if (t1) evidence.push({ label: 'Duval Triangle 1', value: t1 });
  const t4 = result.duvalTriangleResult?.triangle4?.zone;
  if (t4) evidence.push({ label: 'Duval Triangle 4', value: t4 });
  const t5 = result.duvalTriangleResult?.triangle5?.zone;
  if (t5) evidence.push({ label: 'Duval Triangle 5', value: t5 });
  const p1 = result.duvalPentagon1Result?.diagnosis;
  if (p1) evidence.push({ label: 'Duval Pentagon 1', value: p1 });
  const p2 = result.duvalPentagon2Result?.diagnosis;
  if (p2) evidence.push({ label: 'Duval Pentagon 2', value: p2 });

  return (
    <div className="space-y-4">
      <section className="border border-gray-300 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,39,51,0.05)]">
        <div className="flex flex-wrap items-center gap-4">
          <TierBadge tier={recommendation.tier} size="lg" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>derived from</span>
            <StatusBadge status={parseDgaStatus(result.status)} />
            <span>and the Duval fault-zone results below</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Required Actions">
          <ol className="space-y-2.5">
            {recommendation.actions.map((action, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-gray-800 bg-gray-800 font-mono text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{action}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-gray-200 pt-2 text-[11px] text-gray-500">
            Actions are ordered by priority — execute from the top.
          </p>
        </Card>

        <div className="space-y-4">
          <Card title="Why This Tier Was Chosen">
            <ul className="space-y-1.5 text-sm text-gray-700">
              {recommendation.reasoning.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="select-none text-gray-400">—</span>
                  {line}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Supporting Evidence">
            {evidence.length === 0 ? (
              <p className="text-sm text-gray-600">No fault-zone evidence stored for this analysis.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {evidence.map((e) => (
                  <div key={e.label}>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {e.label}
                    </dt>
                    <dd className="font-mono text-sm font-bold text-gray-900">{e.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
