import { Card } from '@/components/ui/Card';
import { DELTA_GAS_KEYS, DELTA_GAS_LABELS, formatDeltaValue } from '@/lib/analysis';
import type { DeltaGasKey } from '@/lib/analysis';
import type { AnalysisResultDetail } from '@/types';
import { GasFlagChip, GAS_FLAG_LABELS, type GasFlag } from './badges';

interface ResponsibleGasesProps {
  detail: AnalysisResultDetail;
}

interface GasRow {
  key: DeltaGasKey;
  label: string;
  current: number;
  delta: number | null;
  rate: number | null;
  flags: GasFlag[];
}

/**
 * Derives per-gas attention flags from data the backend already returns:
 * threshold exceedances (Status Engine), dominant gas (Key Gas Engine),
 * largest delta, and largest generation rate. Pure presentation — no
 * diagnostic logic beyond picking maxima for emphasis.
 */
function buildGasRows(detail: AnalysisResultDetail): GasRow[] {
  const { sample, result } = detail;
  const delta = result.delta;
  const rates = result.rateResult?.rateAvailable ? result.rateResult.rates : null;

  const exceededGases = new Set(
    (result.statusResult?.exceededThresholds ?? []).map((t) => t.gas),
  );
  const dominantGas = result.keyGasResult?.dominantGas ?? null;

  let maxDeltaKey: DeltaGasKey | null = null;
  let maxRateKey: DeltaGasKey | null = null;
  let maxDelta = 0;
  let maxRate = 0;
  for (const key of DELTA_GAS_KEYS) {
    const d = delta?.[key]?.delta;
    if (d != null && Math.abs(d) > maxDelta) {
      maxDelta = Math.abs(d);
      maxDeltaKey = key;
    }
    const r = rates?.[key];
    if (r != null && r > maxRate) {
      maxRate = r;
      maxRateKey = key;
    }
  }

  return DELTA_GAS_KEYS.map((key) => {
    const label = DELTA_GAS_LABELS[key];
    const flags: GasFlag[] = [];
    if (exceededGases.has(label)) flags.push('exceeded');
    if (dominantGas === key) flags.push('dominant');
    if (maxDeltaKey === key) flags.push('maxDelta');
    if (maxRateKey === key) flags.push('maxRate');

    return {
      key,
      label,
      current: sample[key],
      delta: delta?.[key]?.delta ?? null,
      rate: rates?.[key] ?? null,
      flags,
    };
  });
}

/** Step 3 of the workflow: which gases are driving the diagnosis. */
export function ResponsibleGases({ detail }: ResponsibleGasesProps) {
  const rows = buildGasRows(detail);
  const { sample } = detail;
  const rateAvailable = detail.result.rateResult?.rateAvailable ?? false;

  return (
    <Card title="Responsible Gases">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2">Gas</th>
              <th className="px-3 py-2 text-right">Current (ppm)</th>
              <th className="px-3 py-2 text-right">Δ vs Previous</th>
              <th className="px-3 py-2 text-right">Rate (ppm/yr)</th>
              <th className="px-3 py-2">Attention</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const emphasized = row.flags.includes('exceeded');
              return (
                <tr
                  key={row.key}
                  className={`border-b border-gray-200 last:border-b-0 ${
                    emphasized ? 'bg-red-50/60' : row.flags.length > 0 ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className={`px-3 py-2 font-semibold ${emphasized ? 'text-red-900' : 'text-gray-900'}`}>
                    {row.label}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-gray-900">
                    {row.current}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-gray-700">
                    {formatDeltaValue(row.delta)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-gray-700">
                    {row.rate == null ? '—' : row.rate.toFixed(1)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {row.flags.map((flag) => (
                        <GasFlagChip key={flag} flag={flag} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-gray-200 text-gray-600">
              <td className="px-3 py-2">O2</td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                {sample.o2 ?? '—'}
              </td>
              <td className="px-3 py-2 text-right text-xs" colSpan={3}>
                atmospheric gas — not rated
              </td>
            </tr>
            <tr className="text-gray-600">
              <td className="px-3 py-2">N2</td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                {sample.n2 ?? '—'}
              </td>
              <td className="px-3 py-2 text-right text-xs" colSpan={3}>
                atmospheric gas — not rated
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <span>
          <span className="font-semibold text-red-800">{GAS_FLAG_LABELS.exceeded}</span> — exceeds an
          IEEE C57.104 threshold
        </span>
        <span>
          <span className="font-semibold text-sky-800">{GAS_FLAG_LABELS.dominant}</span> — dominant gas
          per Key Gas Method
        </span>
        <span>
          <span className="font-semibold text-amber-800">{GAS_FLAG_LABELS.maxDelta}</span> — largest
          change since previous sample
        </span>
        <span>
          <span className="font-semibold text-violet-800">{GAS_FLAG_LABELS.maxRate}</span> — highest
          generation rate
        </span>
        {detail.isBaselineSample && (
          <span className="italic">Baseline sample — no previous sample for delta comparison.</span>
        )}
        {!rateAvailable && (
          <span className="italic">Rates unavailable — insufficient sample history (IEEE Table 4 needs 3+ samples).</span>
        )}
      </div>
    </Card>
  );
}
