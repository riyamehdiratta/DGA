import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatCard';
import { parseDgaStatus } from '@/lib/analysis';
import {
  PENTAGON1_INTERPRETATIONS,
  PENTAGON2_INTERPRETATIONS,
  TRIANGLE1_INTERPRETATIONS,
  TRIANGLE4_INTERPRETATIONS,
  TRIANGLE5_INTERPRETATIONS,
} from '@/components/visualizations/duvalInterpretations';
import type { AnalysisResultDetail } from '@/types';
import { TierBadge } from './badges';

interface EngineSummaryProps {
  detail: AnalysisResultDetail;
}

interface SummaryRow {
  engine: string;
  diagnosis: ReactNode;
  confidence: string;
  note: string;
  /** Draws the reader's eye to results that demand attention. */
  emphasized?: boolean;
}

function zoneCell(zone: string | null | undefined, emphasized: boolean): ReactNode {
  if (zone == null) {
    return <span className="text-xs italic text-status-pending">Not applicable</span>;
  }
  return (
    <span className={`font-mono text-sm font-bold ${emphasized ? 'text-red-900' : 'text-gray-900'}`}>
      {zone}
    </span>
  );
}

function diagnosisCell(diagnosis: string | null | undefined): ReactNode {
  if (diagnosis == null) {
    return <span className="text-xs italic text-status-pending">Not stored</span>;
  }
  const inconclusive = diagnosis === 'INCONCLUSIVE';
  return (
    <span className={`font-mono text-sm font-bold ${inconclusive ? 'text-gray-500' : 'text-gray-900'}`}>
      {diagnosis.replaceAll('_', ' ')}
    </span>
  );
}

/** Fault zones that indicate an active fault (vs. normal/stray-gassing zones). */
const SEVERE_ZONES = new Set(['D1', 'D2', 'DT', 'T1', 'T2', 'T3', 'T3-H', 'C', 'PD']);

function buildRows(detail: AnalysisResultDetail): SummaryRow[] {
  const { result } = detail;
  const status = result.statusResult;
  const keyGas = result.keyGasResult;
  const doernenburg = result.doernenburgResult;
  const duval = result.duvalTriangleResult;
  const p1 = result.duvalPentagon1Result;
  const p2 = result.duvalPentagon2Result;
  const rec = result.recommendationResult;

  const t1 = duval?.triangle1.zone ?? null;
  const t4 = duval?.triangle4?.zone ?? null;
  const t5 = duval?.triangle5?.zone ?? null;
  const p1z = p1?.diagnosis ?? null;
  const p2z = p2?.diagnosis ?? null;

  return [
    {
      engine: 'Status Engine (IEEE C57.104-2019)',
      diagnosis: result.status ? (
        <StatusBadge status={parseDgaStatus(result.status)} />
      ) : (
        <span className="text-xs italic text-status-pending">Not stored</span>
      ),
      confidence: '—',
      note: status
        ? status.exceededThresholds.length > 0
          ? `${status.exceededThresholds.length} threshold exceedance(s) — ${[...new Set(status.exceededThresholds.map((t) => t.gas))].join(', ')}`
          : 'All gas levels, deltas, and rates within IEEE limits'
        : '—',
      emphasized: result.status === 'STATUS_3',
    },
    {
      engine: 'Key Gas Method',
      diagnosis: diagnosisCell(keyGas?.diagnosis),
      confidence: keyGas?.confidence ?? '—',
      note: keyGas?.dominantGas ? `Dominant gas: ${keyGas.dominantGas.toUpperCase()}` : '—',
      emphasized: keyGas != null && keyGas.diagnosis !== 'INCONCLUSIVE',
    },
    {
      engine: 'Doernenburg Ratio',
      diagnosis: diagnosisCell(doernenburg?.diagnosis),
      confidence: '—',
      note: doernenburg
        ? `R1 ${doernenburg.ratios.r1?.toFixed(2) ?? '—'} · R2 ${doernenburg.ratios.r2?.toFixed(2) ?? '—'} · R3 ${doernenburg.ratios.r3?.toFixed(2) ?? '—'} · R4 ${doernenburg.ratios.r4?.toFixed(2) ?? '—'}`
        : '—',
      emphasized: doernenburg != null && doernenburg.diagnosis !== 'INCONCLUSIVE',
    },
    {
      engine: 'Duval Triangle 1',
      diagnosis: zoneCell(t1, t1 != null && SEVERE_ZONES.has(t1)),
      confidence: '—',
      note: t1 ? TRIANGLE1_INTERPRETATIONS[t1] ?? '—' : 'Routing conditions not met',
      emphasized: t1 != null && SEVERE_ZONES.has(t1),
    },
    {
      engine: 'Duval Triangle 4',
      diagnosis: zoneCell(t4, t4 != null && SEVERE_ZONES.has(t4)),
      confidence: '—',
      note: t4 ? TRIANGLE4_INTERPRETATIONS[t4] ?? '—' : 'Routing conditions not met',
      emphasized: t4 != null && SEVERE_ZONES.has(t4),
    },
    {
      engine: 'Duval Triangle 5',
      diagnosis: zoneCell(t5, t5 != null && SEVERE_ZONES.has(t5)),
      confidence: '—',
      note: t5 ? TRIANGLE5_INTERPRETATIONS[t5] ?? '—' : 'Routing conditions not met',
      emphasized: t5 != null && SEVERE_ZONES.has(t5),
    },
    {
      engine: 'Duval Pentagon 1',
      diagnosis: zoneCell(p1z, p1z != null && SEVERE_ZONES.has(p1z)),
      confidence: '—',
      note: p1z ? PENTAGON1_INTERPRETATIONS[p1z] ?? '—' : 'No centroid computed',
      emphasized: p1z != null && SEVERE_ZONES.has(p1z),
    },
    {
      engine: 'Duval Pentagon 2',
      diagnosis: zoneCell(p2z, p2z != null && SEVERE_ZONES.has(p2z)),
      confidence: '—',
      note: p2z ? PENTAGON2_INTERPRETATIONS[p2z] ?? '—' : 'No centroid computed',
      emphasized: p2z != null && SEVERE_ZONES.has(p2z),
    },
    {
      engine: 'Recommendation Engine',
      diagnosis: rec ? (
        <TierBadge tier={rec.tier} />
      ) : (
        <span className="text-xs italic text-status-pending">Not stored</span>
      ),
      confidence: '—',
      note: rec?.actions[0] ?? '—',
      emphasized: rec != null && (rec.tier === 'URGENT' || rec.tier === 'EXTREME'),
    },
  ];
}

/**
 * Concise cross-engine summary: one row per engine, diagnosis up front,
 * a single short note instead of repeated reasoning paragraphs.
 */
export function EngineSummary({ detail }: EngineSummaryProps) {
  const rows = buildRows(detail);

  return (
    <Card title="Engine Summary">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2">Engine</th>
              <th className="px-3 py-2">Diagnosis</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.engine}
                className={`border-b border-gray-200 last:border-b-0 ${row.emphasized ? 'bg-red-50/40' : ''}`}
              >
                <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-800">{row.engine}</td>
                <td className="px-3 py-2">{row.diagnosis}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.confidence}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
