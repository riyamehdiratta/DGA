import type { GasKey, PeriodBucket } from './ieee/types.js';
import type { StatusResult } from './status.js';

export type NormProfile = 'LOW_RATIO' | 'HIGH_RATIO' | 'DEFAULT_HIGH_RATIO';

export interface GasSampleInput {
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
}

export interface NormProfileSampleInput extends GasSampleInput {
  o2: number | null;
  n2: number | null;
}

/** A dated gas sample — the unit the Rate Engine's multi-point regression operates on. */
export interface RateSampleInput extends GasSampleInput {
  sampleDate: Date;
}

export interface DeltaGas {
  previous: number | null;
  current: number;
  delta: number | null;
}

export interface DeltaResult {
  h2: DeltaGas;
  ch4: DeltaGas;
  c2h6: DeltaGas;
  c2h4: DeltaGas;
  c2h2: DeltaGas;
  co: DeltaGas;
  co2: DeltaGas;
}

export interface NormProfileSelection {
  o2n2Ratio: number | null;
  normProfile: NormProfile;
}

/** Per-gas annualized generation rate (ppm/year), or null when unavailable. */
export interface RateGasValues {
  h2: number | null;
  ch4: number | null;
  c2h6: number | null;
  c2h4: number | null;
  c2h2: number | null;
  co: number | null;
  co2: number | null;
}

export interface RateExceededThreshold {
  sourceTable: 'TABLE_4';
  gas: string;
  actualValue: number;
  thresholdValue: number | 'ANY_INCREASING_RATE';
}

export interface RateResult {
  periodDays: number;
  periodBucket: PeriodBucket | null;
  rates: RateGasValues;
  exceededThresholds: RateExceededThreshold[];
  rateAvailable: boolean;
}

export type KeyGasDiagnosis =
  | 'THERMAL_OIL'
  | 'THERMAL_CELLULOSE'
  | 'PARTIAL_DISCHARGE'
  | 'ARCING'
  | 'INCONCLUSIVE';

export type KeyGasConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface KeyGasResult {
  diagnosis: KeyGasDiagnosis;
  dominantGas: GasKey | null;
  confidence: KeyGasConfidence;
  reasoning: string[];
}

export type DoernenburgDiagnosis =
  | 'THERMAL_DECOMPOSITION'
  | 'CORONA'
  | 'ARCING'
  | 'INCONCLUSIVE';

export interface DoernenburgRatios {
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
}

export interface DoernenburgResult {
  diagnosis: DoernenburgDiagnosis;
  ratios: DoernenburgRatios;
  reasoning: string[];
}

export interface DuvalTriangle1Percentages {
  ch4: number;
  c2h4: number;
  c2h2: number;
}

export type DuvalTriangle1Zone = 'PD' | 'T1' | 'T2' | 'T3' | 'DT' | 'D1' | 'D2';

export interface DuvalTriangle1Result {
  /** null = insufficient/invalid input data (couldn't compute percentages at all). */
  zone: DuvalTriangle1Zone | 'UNCLASSIFIED' | null;
  percentages: DuvalTriangle1Percentages | null;
  warnings: string[];
  reasoning: string[];
}

export interface DuvalTriangle4Percentages {
  h2: number;
  ch4: number;
  c2h6: number;
}

export type DuvalTriangle4Zone = 'PD' | 'S' | 'O' | 'C' | 'ND';

export interface DuvalTriangle4Result {
  zone: DuvalTriangle4Zone | 'UNCLASSIFIED' | null;
  percentages: DuvalTriangle4Percentages | null;
  warnings: string[];
  reasoning: string[];
}

export interface DuvalTriangle5Percentages {
  ch4: number;
  c2h4: number;
  c2h6: number;
}

export type DuvalTriangle5Zone = 'PD' | 'O' | 'S' | 'T2' | 'T3' | 'C' | 'ND';

export interface DuvalTriangle5Result {
  zone: DuvalTriangle5Zone | 'UNCLASSIFIED' | null;
  percentages: DuvalTriangle5Percentages | null;
  warnings: string[];
  reasoning: string[];
}

export interface DuvalTriangleEngineResult {
  triangle1: DuvalTriangle1Result;
  /** Non-null only when triangle1.zone is PD, T1, or T2 (routing rules). */
  triangle4: DuvalTriangle4Result | null;
  /** Non-null only when triangle1.zone is T2 or T3 (routing rules). */
  triangle5: DuvalTriangle5Result | null;
}

/** Shared by Pentagon 1 and (per DUVAL_PENTAGON_2_RULES.md) Pentagon 2 — same coordinate algorithm for both. */
export interface DuvalPentagonCoordinate {
  x: number;
  y: number;
}

export type DuvalPentagon1Zone = 'PD' | 'D1' | 'D2' | 'T1' | 'T2' | 'T3' | 'S';

export interface DuvalPentagon1Result {
  /** null = insufficient/invalid input data (couldn't compute a coordinate at all). */
  diagnosis: DuvalPentagon1Zone | 'OUTSIDE' | null;
  coordinates: DuvalPentagonCoordinate | null;
  reasoning: string[];
}

export type DuvalPentagon2Zone = 'PD' | 'D1' | 'D2' | 'S' | 'O' | 'C' | 'T3-H';

export interface DuvalPentagon2Result {
  /** null = Pentagon 1 produced no coordinate (insufficient/invalid input), so refinement could not run. */
  diagnosis: DuvalPentagon2Zone | 'OUTSIDE' | null;
  coordinates: DuvalPentagonCoordinate | null;
  reasoning: string[];
  /** The literal zone code that matched, if any — null for both OUTSIDE and no-coordinate cases (doc's Output DTO). */
  matchedZone: DuvalPentagon2Zone | null;
}

export type RecommendationTier = 'ROUTINE' | 'MONITOR' | 'INVESTIGATE' | 'URGENT' | 'EXTREME';

export interface RecommendationResult {
  tier: RecommendationTier;
  actions: string[];
  reasoning: string[];
}

/**
 * Inputs the Recommendation Engine consumes from earlier pipeline results.
 * It never computes a new diagnosis — only Status and the Duval-family
 * fault-zone vocabulary (PD/T1/T2/T3/D1/D2/S/O/C/T3-H) drive the tier;
 * Key Gas and Doernenburg are intentionally excluded (DGA_RECOMMENDATIONS.md).
 */
export interface RecommendationEngineInput {
  status: StatusResult['status'];
  duvalTriangle1Zone: DuvalTriangle1Result['zone'];
  duvalTriangle4Zone: DuvalTriangle4Result['zone'] | null;
  duvalTriangle5Zone: DuvalTriangle5Result['zone'] | null;
  duvalPentagon1Diagnosis: DuvalPentagon1Result['diagnosis'];
  duvalPentagon2Diagnosis: DuvalPentagon2Result['diagnosis'];
  /** ppm increase in C2H4 since the previous sample; null when no previous sample exists. */
  c2h4Delta: number | null;
  /** current sample's C2H6 concentration, ppm. */
  c2h6Level: number;
}

export interface PipelineResult {
  normProfile: NormProfile;
  o2n2Ratio: number | null;
  delta: DeltaResult;
  status: StatusResult['status'];
  statusResult: StatusResult;
  rate: RateResult;
  keyGas: KeyGasResult;
  doernenburg: DoernenburgResult;
  duvalTriangle: DuvalTriangleEngineResult;
  duvalPentagon1: DuvalPentagon1Result;
  duvalPentagon2: DuvalPentagon2Result;
  recommendation: RecommendationResult;
}
