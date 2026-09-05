import { DELTA_GAS_KEYS } from './delta.js';
import {
  getTable1Threshold,
  getTable2Threshold,
  getTable3Threshold,
} from './ieee/lookup.js';
import { GAS_KEYS, type GasKey, type TransformerAgeCategory } from './ieee/types.js';
import type { DeltaResult, GasSampleInput, NormProfile, RateResult } from './types.js';

export type DgaStatus = 'STATUS_1' | 'STATUS_2' | 'STATUS_3';

export interface ExceededThreshold {
  sourceTable: 'TABLE_1' | 'TABLE_2' | 'TABLE_3' | 'TABLE_4';
  gas: string;
  actualValue: number;
  thresholdValue: number | 'ANY_INCREASE' | 'ANY_INCREASING_RATE';
}

export interface StatusResult {
  status: DgaStatus;
  reasoning: string[];
  exceededThresholds: ExceededThreshold[];
}

export interface StatusEngineInput {
  normProfile: NormProfile;
  ageCategory: TransformerAgeCategory;
  sample: GasSampleInput;
  delta: DeltaResult;
  /** Rate Engine output. The Status Engine consumes this — it never computes rates itself. */
  rate: RateResult;
}

const GAS_DISPLAY_NAMES: Record<GasKey, string> = {
  h2: 'H2',
  ch4: 'CH4',
  c2h6: 'C2H6',
  c2h4: 'C2H4',
  c2h2: 'C2H2',
  co: 'CO',
  co2: 'CO2',
};

function gasDisplayName(gas: GasKey): string {
  return GAS_DISPLAY_NAMES[gas];
}

/**
 * Resolves IEEE transformer age band from commissioning and sample dates.
 * Returns UNKNOWN when age cannot be determined or is less than one year.
 */
export function resolveTransformerAgeCategory(
  commissioningDate: Date | null | undefined,
  sampleDate: Date,
): TransformerAgeCategory {
  if (!commissioningDate || sampleDate < commissioningDate) {
    return 'UNKNOWN';
  }

  let years = sampleDate.getUTCFullYear() - commissioningDate.getUTCFullYear();
  const monthDiff = sampleDate.getUTCMonth() - commissioningDate.getUTCMonth();
  const dayDiff = sampleDate.getUTCDate() - commissioningDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }

  if (years < 1) {
    return 'UNKNOWN';
  }
  if (years <= 9) {
    return 'YEARS_1_TO_9';
  }
  if (years <= 30) {
    return 'YEARS_10_TO_30';
  }
  return 'YEARS_OVER_30';
}

function evaluateTable3ExceedanceForThreshold(
  gas: GasKey,
  delta: number | null,
  profile: NormProfile,
): ExceededThreshold | null {
  if (delta == null) {
    return null;
  }

  const threshold = getTable3Threshold(profile, gas);
  if (threshold.anyIncrease) {
    if (delta > 0) {
      return {
        sourceTable: 'TABLE_3',
        gas: gasDisplayName(gas),
        actualValue: delta,
        thresholdValue: 'ANY_INCREASE',
      };
    }
    return null;
  }

  if (threshold.ppm != null && delta > threshold.ppm) {
    return {
      sourceTable: 'TABLE_3',
      gas: gasDisplayName(gas),
      actualValue: delta,
      thresholdValue: threshold.ppm,
    };
  }

  return null;
}

function isWithinTable1(
  concentration: number,
  profile: NormProfile,
  ageCategory: TransformerAgeCategory,
  gas: GasKey,
): boolean {
  const threshold = getTable1Threshold(profile, ageCategory, gas);
  return threshold.ppm != null && concentration <= threshold.ppm;
}

function isWithinTable3(
  delta: number | null,
  profile: NormProfile,
  gas: GasKey,
): boolean {
  return evaluateTable3ExceedanceForThreshold(gas, delta, profile) == null;
}

function exceedsTable2(
  concentration: number,
  profile: NormProfile,
  ageCategory: TransformerAgeCategory,
  gas: GasKey,
): ExceededThreshold | null {
  const threshold = getTable2Threshold(profile, ageCategory, gas);
  if (threshold.ppm != null && concentration > threshold.ppm) {
    return {
      sourceTable: 'TABLE_2',
      gas: gasDisplayName(gas),
      actualValue: concentration,
      thresholdValue: threshold.ppm,
    };
  }
  return null;
}

function collectTable1Exceedances(
  sample: GasSampleInput,
  profile: NormProfile,
  ageCategory: TransformerAgeCategory,
): ExceededThreshold[] {
  const exceedances: ExceededThreshold[] = [];

  for (const gas of GAS_KEYS) {
    const threshold = getTable1Threshold(profile, ageCategory, gas);
    const concentration = sample[gas];
    if (threshold.ppm != null && concentration > threshold.ppm) {
      exceedances.push({
        sourceTable: 'TABLE_1',
        gas: gasDisplayName(gas),
        actualValue: concentration,
        thresholdValue: threshold.ppm,
      });
    }
  }

  return exceedances;
}

function collectTable3Exceedances(
  delta: DeltaResult,
  profile: NormProfile,
): ExceededThreshold[] {
  const exceedances: ExceededThreshold[] = [];

  for (const gas of DELTA_GAS_KEYS) {
    const exceedance = evaluateTable3ExceedanceForThreshold(gas, delta[gas].delta, profile);
    if (exceedance) {
      exceedances.push(exceedance);
    }
  }

  return exceedances;
}

function formatThresholdValue(
  value: number | 'ANY_INCREASE' | 'ANY_INCREASING_RATE',
): string {
  if (value === 'ANY_INCREASE') {
    return 'ANY_INCREASE';
  }
  if (value === 'ANY_INCREASING_RATE') {
    return 'ANY_INCREASING_RATE';
  }
  return `${value} ppm`;
}

function formatExceedance(exceedance: ExceededThreshold): string {
  return `${exceedance.gas} (${exceedance.actualValue} ppm) exceeds ${exceedance.sourceTable} threshold (${formatThresholdValue(exceedance.thresholdValue)})`;
}

/**
 * Table 4 reasoning line. When the Rate Engine has no valid window (insufficient
 * sample history), there are zero rates to check, so "all rates <= Table 4" is
 * vacuously true and "any rate > Table 4" is vacuously false — i.e. Table 4
 * simply does not constrain the status in that case.
 */
function rateReasoningLine(rate: RateResult): string {
  if (!rate.rateAvailable) {
    return 'Table 4 rate evaluation unavailable (insufficient sample history for a valid 4-24 month window); Table 4 does not constrain this result.';
  }
  return rate.exceededThresholds.length === 0
    ? 'All gas generation rates are within Table 4 thresholds.'
    : 'One or more gas generation rates exceed Table 4 thresholds.';
}

/**
 * IEEE C57.104-2019 Status Engine.
 *
 * Evaluation order (IEEE_STATUS_LOGIC.md):
 * 1. STATUS_1 — all concentrations <= Table 1, all deltas <= Table 3, all rates <= Table 4
 * 2. STATUS_3 — any concentration > Table 2, or any rate > Table 4
 * 3. STATUS_2 — otherwise
 *
 * Table 4 evaluation is delegated entirely to the Rate Engine (rate.ts) — this
 * engine never computes generation rates itself, only consumes RateResult.
 */
export function runStatusEngine(input: StatusEngineInput): StatusResult {
  const { normProfile, ageCategory, sample, delta, rate } = input;

  const table1Pass = GAS_KEYS.every((gas) =>
    isWithinTable1(sample[gas], normProfile, ageCategory, gas),
  );
  const table3Pass = DELTA_GAS_KEYS.every((gas) =>
    isWithinTable3(delta[gas].delta, normProfile, gas),
  );
  const table4Pass = rate.exceededThresholds.length === 0;

  if (table1Pass && table3Pass && table4Pass) {
    return {
      status: 'STATUS_1',
      reasoning: [
        'All gas concentrations are within Table 1 thresholds.',
        'All delta values are within Table 3 thresholds.',
        rateReasoningLine(rate),
      ],
      exceededThresholds: [],
    };
  }

  const table2Exceedances = GAS_KEYS.flatMap((gas) => {
    const exceedance = exceedsTable2(sample[gas], normProfile, ageCategory, gas);
    return exceedance ? [exceedance] : [];
  });

  // Any Table 4 exceedance triggers STATUS_3 directly (IEEE_STATUS_LOGIC.md:
  // "Any generation rate exceeds its applicable Table 4 threshold") — there is
  // no intermediate near-miss state for Table 4 the way there is for Table 1.
  const table4Status3Exceedances = rate.exceededThresholds;

  if (table2Exceedances.length > 0 || table4Status3Exceedances.length > 0) {
    const exceededThresholds = [...table2Exceedances, ...table4Status3Exceedances];
    return {
      status: 'STATUS_3',
      reasoning: [
        'Potential concern: threshold exceedance detected.',
        ...exceededThresholds.map((item) => formatExceedance(item)),
      ],
      exceededThresholds,
    };
  }

  // rate.exceededThresholds is guaranteed empty here: a non-empty Table 4
  // exceedance list would already have returned STATUS_3 above.
  const status2Exceedances = [
    ...collectTable1Exceedances(sample, normProfile, ageCategory),
    ...collectTable3Exceedances(delta, normProfile),
  ];

  return {
    status: 'STATUS_2',
    reasoning: [
      'Increased transformer surveillance: STATUS_1 not satisfied and STATUS_3 not triggered.',
      ...status2Exceedances.map((item) => formatExceedance(item)),
      rateReasoningLine(rate),
    ],
    exceededThresholds: status2Exceedances,
  };
}
