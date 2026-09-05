import type { AnalysisResult, DgaStatus, ExceededThreshold } from '@/types';
import {
  TRIANGLE1_INTERPRETATIONS,
  TRIANGLE4_INTERPRETATIONS,
  TRIANGLE5_INTERPRETATIONS,
  PENTAGON1_INTERPRETATIONS,
  PENTAGON2_INTERPRETATIONS,
} from '@/components/visualizations/duvalInterpretations';

const DGA_STATUSES: DgaStatus[] = ['STATUS_1', 'STATUS_2', 'STATUS_3'];

export function isDgaStatus(value: string): value is DgaStatus {
  return (DGA_STATUSES as string[]).includes(value);
}

export function parseDgaStatus(status: string | null | undefined): DgaStatus | 'Pending' {
  if (status == null) return 'Pending';
  return isDgaStatus(status) ? status : 'Pending';
}

const STATUS_LABELS: Record<DgaStatus, string> = {
  STATUS_1: 'Status 1',
  STATUS_2: 'Status 2',
  STATUS_3: 'Status 3',
};

export function formatDgaStatus(status: DgaStatus | 'Pending'): string {
  return status === 'Pending' ? 'Pending' : STATUS_LABELS[status];
}

/** Primary diagnosis text for UI — derived from engine results, most specific first. */
export function getDisplayDiagnosis(analysis: AnalysisResult): string {
  if (analysis.recommendationResult) {
    return `${analysis.recommendationResult.tier} — ${analysis.recommendationResult.actions[0] ?? ''}`.trim();
  }
  if (analysis.duvalPentagon2Result?.diagnosis) {
    return analysis.duvalPentagon2Result.diagnosis;
  }
  if (analysis.duvalPentagon1Result?.diagnosis) {
    return analysis.duvalPentagon1Result.diagnosis;
  }
  if (analysis.duvalTriangleResult?.triangle1.zone) {
    return analysis.duvalTriangleResult.triangle1.zone;
  }
  if (analysis.doernenburgResult?.diagnosis) {
    return analysis.doernenburgResult.diagnosis;
  }
  if (analysis.keyGasResult?.diagnosis) {
    return analysis.keyGasResult.diagnosis;
  }
  if (analysis.status) return `DGA status: ${analysis.status}`;
  return 'Pending IEEE calculation — sample recorded';
}

/**
 * Primary fault-zone diagnosis in DTL's own "T1 — Thermal fault < 300 °C
 * (refined: C — Possible paper carbonization)" style — Duval Triangle 1
 * (refined by Triangle 4/5 when present) first, falling back to Pentagon
 * 2/1. Returns null when no Duval-family result classified a zone.
 */
export function getFaultZoneDiagnosis(analysis: AnalysisResult): string | null {
  const triangle1 = analysis.duvalTriangleResult?.triangle1;
  if (triangle1?.zone && triangle1.zone !== 'UNCLASSIFIED') {
    const base = `${triangle1.zone} — ${TRIANGLE1_INTERPRETATIONS[triangle1.zone] ?? triangle1.zone}`;
    const triangle4 = analysis.duvalTriangleResult?.triangle4;
    const triangle5 = analysis.duvalTriangleResult?.triangle5;
    const refinement = triangle4 ?? triangle5;
    if (refinement?.zone && refinement.zone !== 'UNCLASSIFIED') {
      const interpretations = triangle4 ? TRIANGLE4_INTERPRETATIONS : TRIANGLE5_INTERPRETATIONS;
      return `${base} (refined: ${refinement.zone} — ${interpretations[refinement.zone] ?? refinement.zone})`;
    }
    return base;
  }

  const pentagon2 = analysis.duvalPentagon2Result?.diagnosis;
  if (pentagon2 && pentagon2 !== 'OUTSIDE') {
    return `${pentagon2} — ${PENTAGON2_INTERPRETATIONS[pentagon2] ?? pentagon2} (Duval Pentagon 2)`;
  }

  const pentagon1 = analysis.duvalPentagon1Result?.diagnosis;
  if (pentagon1 && pentagon1 !== 'OUTSIDE') {
    return `${pentagon1} — ${PENTAGON1_INTERPRETATIONS[pentagon1] ?? pentagon1} (Duval Pentagon 1)`;
  }

  return null;
}

const THRESHOLD_TABLE_LABELS: Record<ExceededThreshold['sourceTable'], string> = {
  TABLE_1: 'Table 1 — 90th percentile concentration',
  TABLE_2: 'Table 2 — 95th percentile concentration',
  TABLE_3: 'Table 3 — 95th percentile delta',
  TABLE_4: 'Table 4 — 95th percentile generation rate',
};

const THRESHOLD_TABLE_UNITS: Record<ExceededThreshold['sourceTable'], string> = {
  TABLE_1: 'ppm',
  TABLE_2: 'ppm',
  TABLE_3: 'Δ ppm',
  TABLE_4: 'ppm/yr',
};

export function formatThresholdSource(t: ExceededThreshold): string {
  return THRESHOLD_TABLE_LABELS[t.sourceTable];
}

export function formatThresholdLimit(t: ExceededThreshold): string {
  if (t.thresholdValue === 'ANY_INCREASE') return 'any increase';
  if (t.thresholdValue === 'ANY_INCREASING_RATE') return 'any increasing rate';
  return `${t.thresholdValue} ${THRESHOLD_TABLE_UNITS[t.sourceTable]}`;
}

/** Rates come back with full float precision — round for display. */
export function formatThresholdActual(t: ExceededThreshold): string {
  const value = t.actualValue;
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${rounded} ${THRESHOLD_TABLE_UNITS[t.sourceTable]}`;
}

export function isAnalysisPending(analysis: AnalysisResult): boolean {
  return (
    analysis.status == null &&
    analysis.keyGasResult == null &&
    analysis.doernenburgResult == null &&
    analysis.duvalTriangleResult == null &&
    analysis.duvalPentagon1Result == null
  );
}
