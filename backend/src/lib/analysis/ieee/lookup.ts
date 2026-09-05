import { TABLE_1, TABLE_2, TABLE_3, TABLE_4 } from './tables.js';
import type {
  GasKey,
  IeeeThreshold,
  NormProfile,
  PeriodBucket,
  Table1LookupParams,
  Table2LookupParams,
  Table3LookupParams,
  Table4LookupParams,
  TransformerAgeCategory,
} from './types.js';

/**
 * Table 1 — 90th percentile concentration threshold (µL/L).
 * Status 1/2 boundary: concentrations at or above this value warrant comparison to Table 2.
 */
export function getTable1Threshold(
  profile: NormProfile,
  age: TransformerAgeCategory,
  gas: GasKey,
): IeeeThreshold;

export function getTable1Threshold(params: Table1LookupParams): IeeeThreshold;

export function getTable1Threshold(
  profileOrParams: NormProfile | Table1LookupParams,
  age?: TransformerAgeCategory,
  gas?: GasKey,
): IeeeThreshold {
  if (typeof profileOrParams === 'object') {
    return TABLE_1[profileOrParams.profile][profileOrParams.age][profileOrParams.gas];
  }
  return TABLE_1[profileOrParams][age!][gas!];
}

/**
 * Table 2 — 95th percentile concentration threshold (µL/L).
 * Status 2/3 boundary: concentrations at or above this value indicate potential concern.
 */
export function getTable2Threshold(
  profile: NormProfile,
  age: TransformerAgeCategory,
  gas: GasKey,
): IeeeThreshold;

export function getTable2Threshold(params: Table2LookupParams): IeeeThreshold;

export function getTable2Threshold(
  profileOrParams: NormProfile | Table2LookupParams,
  age?: TransformerAgeCategory,
  gas?: GasKey,
): IeeeThreshold {
  if (typeof profileOrParams === 'object') {
    return TABLE_2[profileOrParams.profile][profileOrParams.age][profileOrParams.gas];
  }
  return TABLE_2[profileOrParams][age!][gas!];
}

/**
 * Table 3 — 95th percentile absolute delta threshold (µL/L) between successive samples.
 */
export function getTable3Threshold(profile: NormProfile, gas: GasKey): IeeeThreshold;

export function getTable3Threshold(params: Table3LookupParams): IeeeThreshold;

export function getTable3Threshold(
  profileOrParams: NormProfile | Table3LookupParams,
  gas?: GasKey,
): IeeeThreshold {
  if (typeof profileOrParams === 'object') {
    return TABLE_3[profileOrParams.profile][profileOrParams.gas];
  }
  return TABLE_3[profileOrParams][gas!];
}

/**
 * Table 4 — 95th percentile generation rate threshold (µL/L per year) from multi-point analysis.
 */
export function getTable4Threshold(
  profile: NormProfile,
  period: PeriodBucket,
  gas: GasKey,
): IeeeThreshold;

export function getTable4Threshold(params: Table4LookupParams): IeeeThreshold;

export function getTable4Threshold(
  profileOrParams: NormProfile | Table4LookupParams,
  period?: PeriodBucket,
  gas?: GasKey,
): IeeeThreshold {
  if (typeof profileOrParams === 'object') {
    return TABLE_4[profileOrParams.profile][profileOrParams.period][profileOrParams.gas];
  }
  return TABLE_4[profileOrParams][period!][gas!];
}
