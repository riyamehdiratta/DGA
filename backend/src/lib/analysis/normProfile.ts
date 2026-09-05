import type { NormProfile, NormProfileSampleInput, NormProfileSelection } from './types.js';

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
  sample: Pick<NormProfileSampleInput, 'o2' | 'n2'>,
): NormProfileSelection {
  return selectNormProfile(sample.o2, sample.n2);
}

/** Norm Profile engine — selects IEEE norm table set from O₂/N₂ ratio. */
export function runNormProfileEngine(
  sample: Pick<NormProfileSampleInput, 'o2' | 'n2'>,
): NormProfileSelection {
  return selectNormProfileFromSample(sample);
}
