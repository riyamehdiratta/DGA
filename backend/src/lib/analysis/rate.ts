import { getTable4Threshold } from './ieee/lookup.js';
import { GAS_KEYS, type GasKey, type PeriodBucket } from './ieee/types.js';
import type {
  NormProfile,
  RateExceededThreshold,
  RateGasValues,
  RateResult,
  RateSampleInput,
} from './types.js';

const MIN_SAMPLES = 3;
const MAX_SAMPLES = 6;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Annualization constant for slope-per-day -> ppm/year. Not an IEEE threshold — a unit conversion. */
const DAYS_PER_YEAR = 365.25;

const GAS_DISPLAY_NAMES: Record<GasKey, string> = {
  h2: 'H2',
  ch4: 'CH4',
  c2h6: 'C2H6',
  c2h4: 'C2H4',
  c2h2: 'C2H2',
  co: 'CO',
  co2: 'CO2',
};

function emptyRates(): RateGasValues {
  return { h2: null, ch4: null, c2h6: null, c2h4: null, c2h2: null, co: null, co2: null };
}

function unavailable(periodDays: number): RateResult {
  return {
    periodDays,
    periodBucket: null,
    rates: emptyRates(),
    exceededThresholds: [],
    rateAvailable: false,
  };
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * Whole calendar months between two dates (same convention as
 * `resolveTransformerAgeCategory` in status.ts) — used for the 4/10/24-month
 * period-bucket boundaries, which are calendar concepts, not fixed day counts.
 */
function monthsBetween(start: Date, end: Date): number {
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }
  return months;
}

function resolvePeriodBucket(periodMonths: number): PeriodBucket | null {
  if (periodMonths >= 4 && periodMonths < 10) {
    return 'MONTHS_4_TO_9';
  }
  if (periodMonths >= 10 && periodMonths <= 24) {
    return 'MONTHS_10_TO_24';
  }
  return null;
}

/** Ordinary-least-squares slope of y over x. */
function linearRegressionSlope(points: Array<{ x: number; y: number }>): number {
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return 0;
  }
  return (n * sumXY - sumX * sumY) / denominator;
}

function computeRates(window: RateSampleInput[]): RateGasValues {
  const t0 = window[0].sampleDate.getTime();
  const rates = {} as RateGasValues;

  for (const gas of GAS_KEYS) {
    const points = window.map((s) => ({
      x: (s.sampleDate.getTime() - t0) / MS_PER_DAY,
      y: s[gas],
    }));
    const slopePerDay = linearRegressionSlope(points);
    rates[gas] = slopePerDay * DAYS_PER_YEAR;
  }

  return rates;
}

function collectExceedances(
  rates: RateGasValues,
  normProfile: NormProfile,
  periodBucket: PeriodBucket,
): RateExceededThreshold[] {
  const exceedances: RateExceededThreshold[] = [];

  for (const gas of GAS_KEYS) {
    const rate = rates[gas];
    if (rate == null) {
      continue;
    }

    const threshold = getTable4Threshold(normProfile, periodBucket, gas);

    if (threshold.anyIncreasingRate) {
      if (rate > 0) {
        exceedances.push({
          sourceTable: 'TABLE_4',
          gas: GAS_DISPLAY_NAMES[gas],
          actualValue: rate,
          thresholdValue: 'ANY_INCREASING_RATE',
        });
      }
      continue;
    }

    if (threshold.ppm != null && rate > threshold.ppm) {
      exceedances.push({
        sourceTable: 'TABLE_4',
        gas: GAS_DISPLAY_NAMES[gas],
        actualValue: rate,
        thresholdValue: threshold.ppm,
      });
    }
  }

  return exceedances;
}

/**
 * IEEE C57.104-2019 Rate Engine.
 *
 * Selects 3-6 of the most recent chronologically-ordered samples, requires the
 * selected window to span 4-24 months (discarding older samples to fit),
 * computes an annualized ppm/year generation rate per gas via linear best-fit
 * regression, and compares each rate against the applicable Table 4 threshold.
 *
 * Does not assign DGA Status — see status.ts.
 */
export function runRateEngine(samples: RateSampleInput[], normProfile: NormProfile): RateResult {
  const sorted = [...samples].sort((a, b) => a.sampleDate.getTime() - b.sampleDate.getTime());
  const recent = sorted.slice(-MAX_SAMPLES);

  if (recent.length < MIN_SAMPLES) {
    const periodDays =
      recent.length >= 2 ? daysBetween(recent[0].sampleDate, recent[recent.length - 1].sampleDate) : 0;
    return unavailable(periodDays);
  }

  let window = recent;
  while (
    window.length > MIN_SAMPLES &&
    monthsBetween(window[0].sampleDate, window[window.length - 1].sampleDate) > 24
  ) {
    window = window.slice(1);
  }

  const periodDays = daysBetween(window[0].sampleDate, window[window.length - 1].sampleDate);
  const periodMonths = monthsBetween(window[0].sampleDate, window[window.length - 1].sampleDate);
  const periodBucket = resolvePeriodBucket(periodMonths);

  if (periodBucket == null) {
    return unavailable(periodDays);
  }

  const rates = computeRates(window);
  const exceededThresholds = collectExceedances(rates, normProfile, periodBucket);

  return {
    periodDays,
    periodBucket,
    rates,
    exceededThresholds,
    rateAvailable: true,
  };
}
