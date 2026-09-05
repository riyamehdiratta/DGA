import { Card } from '@/components/ui/Card';
import type { DoernenburgResult, KeyGasResult } from '@/types';

const CONFIDENCE_STYLES: Record<KeyGasResult['confidence'], string> = {
  HIGH: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  MEDIUM: 'border-amber-300 bg-amber-50 text-amber-800',
  LOW: 'border-gray-300 bg-gray-50 text-gray-600',
};

function DiagnosisValue({ diagnosis }: { diagnosis: string }) {
  const inconclusive = diagnosis === 'INCONCLUSIVE';
  return (
    <span
      className={`font-mono text-sm font-bold ${inconclusive ? 'text-gray-500' : 'text-gray-900'}`}
    >
      {diagnosis.replaceAll('_', ' ')}
    </span>
  );
}

function ReasoningList({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 border-t border-gray-200 pt-2 text-xs text-gray-600">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="select-none text-gray-400">—</span>
          {line}
        </li>
      ))}
    </ul>
  );
}

export function KeyGasCard({ result }: { result: KeyGasResult | null }) {
  return (
    <Card title="Key Gas Method">
      {result ? (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Diagnosis</p>
              <DiagnosisValue diagnosis={result.diagnosis} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Dominant Gas</p>
              <span className="font-mono text-sm font-bold uppercase text-gray-900">
                {result.dominantGas ?? '—'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Confidence</p>
              <span
                className={`inline-block border px-2 py-0.5 font-mono text-xs font-bold ${CONFIDENCE_STYLES[result.confidence]}`}
              >
                {result.confidence}
              </span>
            </div>
          </div>
          <ReasoningList lines={result.reasoning} />
        </>
      ) : (
        <p className="text-sm italic text-status-pending">No Key Gas result stored for this analysis.</p>
      )}
    </Card>
  );
}

const RATIO_DEFS = [
  { key: 'r1', label: 'R1', formula: 'CH₄ / H₂' },
  { key: 'r2', label: 'R2', formula: 'C₂H₂ / C₂H₄' },
  { key: 'r3', label: 'R3', formula: 'C₂H₂ / CH₄' },
  { key: 'r4', label: 'R4', formula: 'C₂H₆ / C₂H₂' },
] as const;

export function DoernenburgCard({ result }: { result: DoernenburgResult | null }) {
  return (
    <Card title="Doernenburg Ratio Method">
      {result ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Diagnosis</p>
              <DiagnosisValue diagnosis={result.diagnosis} />
            </div>
            <dl className="flex gap-4">
              {RATIO_DEFS.map(({ key, label, formula }) => (
                <div key={key} className="text-center">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500" title={formula}>
                    {label}
                  </dt>
                  <dd className="font-mono text-sm tabular-nums text-gray-900">
                    {result.ratios[key] == null ? '—' : result.ratios[key].toFixed(2)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <ReasoningList lines={result.reasoning} />
        </>
      ) : (
        <p className="text-sm italic text-status-pending">No Doernenburg result stored for this analysis.</p>
      )}
    </Card>
  );
}
