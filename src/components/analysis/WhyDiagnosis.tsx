import { Card } from '@/components/ui/Card';
import {
  formatNormProfile,
  formatThresholdActual,
  formatThresholdLimit,
  formatThresholdSource,
} from '@/lib/analysis';
import type { AnalysisResultDetail } from '@/types';

interface WhyDiagnosisProps {
  detail: AnalysisResultDetail;
}

/** Step 2 of the workflow: the Status Engine's reasoning, made readable. */
export function WhyDiagnosis({ detail }: WhyDiagnosisProps) {
  const statusResult = detail.result.statusResult;

  if (!statusResult) {
    return (
      <Card title="Why This Diagnosis">
        <p className="text-sm italic text-status-pending">
          No status reasoning is stored for this analysis.
        </p>
      </Card>
    );
  }

  const { reasoning, exceededThresholds } = statusResult;

  return (
    <Card title="Why This Diagnosis">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Status Engine Reasoning
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {reasoning.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="select-none text-gray-400">—</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            IEEE C57.104-2019 Threshold Exceedances
          </p>
          <p className="mb-2 text-xs text-gray-500">
            Using {formatNormProfile(detail.summary.normProfile)} thresholds.
          </p>
          {exceededThresholds.length === 0 ? (
            <p className="text-sm text-gray-600">
              No thresholds exceeded — all gas levels, deltas, and rates are within their
              applicable IEEE limits.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Gas</th>
                    <th className="px-3 py-2 text-right">Actual</th>
                    <th className="px-3 py-2 text-right">Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {exceededThresholds.map((t, i) => (
                    <tr key={i} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-3 py-2 text-xs text-gray-600">{formatThresholdSource(t)}</td>
                      <td className="px-3 py-2 font-semibold text-red-800">{t.gas}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs tabular-nums font-semibold text-red-800">
                        {formatThresholdActual(t)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-gray-700">
                        {formatThresholdLimit(t)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
