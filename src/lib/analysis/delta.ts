import type { DgaSample } from '@/types';
import type { DeltaAnalysisRow, DeltaGas, DeltaResult } from './types';

export const DELTA_GAS_KEYS = [
  'h2',
  'ch4',
  'c2h6',
  'c2h4',
  'c2h2',
  'co',
  'co2',
] as const;

export type DeltaGasKey = (typeof DELTA_GAS_KEYS)[number];

export const DELTA_GAS_LABELS: Record<DeltaGasKey, string> = {
  h2: 'H2',
  ch4: 'CH4',
  c2h6: 'C2H6',
  c2h4: 'C2H4',
  c2h2: 'C2H2',
  co: 'CO',
  co2: 'CO2',
};

type DeltaSample = Pick<DgaSample, DeltaGasKey>;

function computeDeltaGas(current: number, previous: number | null): DeltaGas {
  if (previous == null) {
    return { previous: null, current, delta: null };
  }
  return { previous, current, delta: current - previous };
}

/**
 * Delta Engine — computes per-gas deltas vs. the previous sample.
 * When no previous sample exists, current values are recorded with null previous/delta.
 */
export function runDeltaEngine(
  currentSample: DeltaSample,
  previousSample: DeltaSample | null,
): DeltaResult {
  const previous = previousSample ?? null;

  return DELTA_GAS_KEYS.reduce((result, key) => {
    result[key] = computeDeltaGas(
      currentSample[key],
      previous ? previous[key] : null,
    );
    return result;
  }, {} as DeltaResult);
}

export function hasDeltaComparison(delta: DeltaResult): boolean {
  return delta.h2.previous != null;
}

export function deltaResultToRows(delta: DeltaResult): DeltaAnalysisRow[] {
  return DELTA_GAS_KEYS.map((key) => ({
    gas: DELTA_GAS_LABELS[key],
    previous: delta[key].previous,
    current: delta[key].current,
    delta: delta[key].delta,
  }));
}

export function formatDeltaValue(value: number | null): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}
