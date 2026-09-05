/**
 * IEEE C57.104-2019 threshold table types.
 * Single source of truth for norm keys used by Status, Rate, and related engines.
 */

/** Threshold value in µL/L (ppm) for Tables 1–3; µL/L per year (ppm/year) for Table 4 */
export interface IeeeThreshold {
  ppm?: number;
  /** Table 3 C₂H₂ — any positive delta exceeds threshold */
  anyIncrease?: true;
  /** Table 4 C₂H₂ — any positive generation rate exceeds threshold */
  anyIncreasingRate?: true;
}

/** O₂/N₂ ratio profile — selects which column set applies in Tables 1–2 */
export const NORM_PROFILES = [
  'LOW_RATIO',
  'HIGH_RATIO',
  'DEFAULT_HIGH_RATIO',
] as const;

export type NormProfile = (typeof NORM_PROFILES)[number];

/**
 * Transformer age band per IEEE C57.104-2019 Tables 1–2.
 * UNKNOWN is used when commissioning age cannot be determined.
 */
export const TRANSFORMER_AGE_CATEGORIES = [
  'UNKNOWN',
  'YEARS_1_TO_9',
  'YEARS_10_TO_30',
  'YEARS_OVER_30',
] as const;

export type TransformerAgeCategory = (typeof TRANSFORMER_AGE_CATEGORIES)[number];

/** Dissolved fault gases covered by IEEE percentile norm tables */
export const GAS_KEYS = [
  'h2',
  'ch4',
  'c2h6',
  'c2h4',
  'c2h2',
  'co',
  'co2',
] as const;

export type GasKey = (typeof GAS_KEYS)[number];

/**
 * Sampling period bucket for Table 4 multi-point rate analysis.
 * IEEE uses 3–6 consecutive samples spanning 4–24 months.
 */
export const PERIOD_BUCKETS = [
  'MONTHS_4_TO_9',
  'MONTHS_10_TO_24',
] as const;

export type PeriodBucket = (typeof PERIOD_BUCKETS)[number];

/** Table 1 — 90th percentile gas concentrations (µL/L) by profile, age, and gas */
export type Table1 = {
  readonly [P in NormProfile]: {
    readonly [A in TransformerAgeCategory]: {
      readonly [G in GasKey]: IeeeThreshold;
    };
  };
};

/** Table 2 — 95th percentile gas concentrations (µL/L) by profile, age, and gas */
export type Table2 = {
  readonly [P in NormProfile]: {
    readonly [A in TransformerAgeCategory]: {
      readonly [G in GasKey]: IeeeThreshold;
    };
  };
};

/** Table 3 — 95th percentile absolute delta between successive samples (µL/L) */
export type Table3 = {
  readonly [P in NormProfile]: {
    readonly [G in GasKey]: IeeeThreshold;
  };
};

/** Table 4 — 95th percentile gas generation rates from multi-point analysis (µL/L per year) */
export type Table4 = {
  readonly [P in NormProfile]: {
    readonly [B in PeriodBucket]: {
      readonly [G in GasKey]: IeeeThreshold;
    };
  };
};

export interface Table1LookupParams {
  profile: NormProfile;
  age: TransformerAgeCategory;
  gas: GasKey;
}

export interface Table2LookupParams {
  profile: NormProfile;
  age: TransformerAgeCategory;
  gas: GasKey;
}

export interface Table3LookupParams {
  profile: NormProfile;
  gas: GasKey;
}

export interface Table4LookupParams {
  profile: NormProfile;
  period: PeriodBucket;
  gas: GasKey;
}
