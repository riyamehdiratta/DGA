import type { DgaSample } from '@/types';
import type { AnalysisPipelineContext, NormProfile, NormProfileSelection } from './types';

export const O2N2_RATIO_THRESHOLD = 0.2;

export function isO2N2Provided(
  o2: number | null | undefined,
  n2: number | null | undefined,
): boolean {
  return o2 != null && n2 != null && n2 > 0;
}

export function selectNormProfile(
  o2: number | null | undefined,
  n2: number | null | undefined,
): NormProfileSelection {
  if (!isO2N2Provided(o2, n2)) {
    return { o2n2Ratio: null, normProfile: 'DEFAULT_HIGH_RATIO' };
  }

  const ratio = o2! / n2!;
  const normProfile: NormProfile = ratio <= O2N2_RATIO_THRESHOLD ? 'LOW_RATIO' : 'HIGH_RATIO';

  return { o2n2Ratio: ratio, normProfile };
}

export function selectNormProfileFromSample(
  sample: Pick<DgaSample, 'o2' | 'n2'>,
): NormProfileSelection {
  return selectNormProfile(sample.o2, sample.n2);
}

/** Norm Profile engine — selects IEEE norm table set from O₂/N₂ ratio. */
export function runNormProfileEngine(
  sample: Pick<DgaSample, 'o2' | 'n2'>,
): NormProfileSelection {
  return selectNormProfileFromSample(sample);
}

/** Whether IEEE high-ratio norm tables apply (HIGH_RATIO or default when O₂/N₂ absent). */
export function usesHighRatioNormTables(profile: NormProfile): boolean {
  return profile === 'HIGH_RATIO' || profile === 'DEFAULT_HIGH_RATIO';
}

export function resolveNormProfileFromContext(
  ctx: AnalysisPipelineContext,
): NormProfileSelection {
  return { o2n2Ratio: ctx.o2n2Ratio, normProfile: ctx.normProfile };
}

export function formatO2N2Ratio(ratio: number | null | undefined): string {
  return ratio == null ? '—' : ratio.toFixed(4);
}

export function formatNormProfile(profile: NormProfile): string {
  switch (profile) {
    case 'LOW_RATIO':
      return 'Low O₂/N₂ Ratio (≤ 0.2)';
    case 'HIGH_RATIO':
      return 'High O₂/N₂ Ratio (> 0.2)';
    case 'DEFAULT_HIGH_RATIO':
      return 'Default — High Ratio Tables (O₂/N₂ not provided)';
  }
}
