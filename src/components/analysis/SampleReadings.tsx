import { Card } from '@/components/ui/Card';
import { DELTA_GAS_KEYS, DELTA_GAS_LABELS } from '@/lib/analysis';
import type { AnalysisResultDetail } from '@/types';

interface SampleReadingsProps {
  detail: AnalysisResultDetail;
}

/**
 * Step 0: the plain, undiagnosed sample data — what was actually measured,
 * with no threshold/flag emphasis. ResponsibleGases (further down the
 * Overview tab) covers the same current-value column plus deltas, rates,
 * and diagnostic flags; this section exists so "what did the lab measure"
 * has one unambiguous, purely-data answer before any interpretation.
 */
export function SampleReadings({ detail }: SampleReadingsProps) {
  const { sample, result } = detail;
  const delta = result.delta;

  return (
    <Card title="Sample Readings">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2">Gas</th>
              <th className="px-3 py-2 text-right">Prior (ppm)</th>
              <th className="px-3 py-2 text-right">Current (ppm)</th>
            </tr>
          </thead>
          <tbody>
            {DELTA_GAS_KEYS.map((key) => {
              const prior = delta?.[key]?.previous;
              return (
                <tr key={key} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-3 py-2 font-semibold text-gray-900">{DELTA_GAS_LABELS[key]}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-gray-600">
                    {prior == null ? '—' : prior}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums font-semibold text-gray-900">
                    {sample[key]}
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-gray-200 text-gray-600">
              <td className="px-3 py-2">O2</td>
              <td className="px-3 py-2 text-right text-xs text-gray-400">—</td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">{sample.o2 ?? '—'}</td>
            </tr>
            <tr className="text-gray-600">
              <td className="px-3 py-2">N2</td>
              <td className="px-3 py-2 text-right text-xs text-gray-400">—</td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">{sample.n2 ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {sample.remarks && <p className="mt-2 text-xs text-gray-500">Remarks: {sample.remarks}</p>}
    </Card>
  );
}
