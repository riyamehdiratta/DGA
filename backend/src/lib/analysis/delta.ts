import type { DeltaResult, DeltaGas, GasSampleInput } from "./types.js";

export const DELTA_GAS_KEYS = [
  "h2",
  "ch4",
  "c2h6",
  "c2h4",
  "c2h2",
  "co",
  "co2",
] as const;

export type DeltaGasKey = (typeof DELTA_GAS_KEYS)[number];

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
  currentSample: GasSampleInput,
  previousSample: GasSampleInput | null,
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

export function deltaResultToScalars(delta: DeltaResult) {
  return {
    h2Delta: delta.h2.delta,
    ch4Delta: delta.ch4.delta,
    c2h6Delta: delta.c2h6.delta,
    c2h4Delta: delta.c2h4.delta,
    c2h2Delta: delta.c2h2.delta,
    coDelta: delta.co.delta,
    co2Delta: delta.co2.delta,
  };
}
