import { describe, expect, it } from 'vitest';
import { runRateEngine } from './rate.js';
import type { NormProfile, RateSampleInput } from './types.js';

const DAYS_PER_YEAR = 365.25;

const ZERO_GASES = { h2: 0, ch4: 0, c2h6: 0, c2h4: 0, c2h2: 0, co: 0, co2: 0 };

function sample(date: string, overrides: Partial<RateSampleInput> = {}): RateSampleInput {
  return {
    ...ZERO_GASES,
    sampleDate: new Date(`${date}T00:00:00.000Z`),
    ...overrides,
  };
}

function daysBetween(a: string, b: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(`${b}T00:00:00.000Z`).getTime() - new Date(`${a}T00:00:00.000Z`).getTime()) /
      MS_PER_DAY,
  );
}

describe('sample selection — insufficient samples', () => {
  it('returns rate unavailable with zero samples', () => {
    const result = runRateEngine([], 'LOW_RATIO');

    expect(result).toEqual({
      periodDays: 0,
      periodBucket: null,
      rates: { h2: null, ch4: null, c2h6: null, c2h4: null, c2h2: null, co: null, co2: null },
      exceededThresholds: [],
      rateAvailable: false,
    });
  });

  it('returns rate unavailable with only two samples, reporting their span', () => {
    const result = runRateEngine(
      [sample('2023-01-01'), sample('2023-03-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(false);
    expect(result.periodBucket).toBeNull();
    expect(result.periodDays).toBe(daysBetween('2023-01-01', '2023-03-01'));
    expect(result.rates.h2).toBeNull();
    expect(result.exceededThresholds).toEqual([]);
  });
});

describe('time window — period too short', () => {
  it('returns unavailable when 3 samples span less than 4 months', () => {
    const result = runRateEngine(
      [sample('2023-01-01'), sample('2023-01-15'), sample('2023-02-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(false);
    expect(result.periodBucket).toBeNull();
  });
});

describe('period bucket boundaries', () => {
  it('selects MONTHS_4_TO_9 at exactly 4 calendar months', () => {
    const result = runRateEngine(
      [sample('2023-01-01'), sample('2023-03-01'), sample('2023-05-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(true);
    expect(result.periodBucket).toBe('MONTHS_4_TO_9');
  });

  it('is unavailable one day short of 4 months', () => {
    const result = runRateEngine(
      [sample('2023-01-02'), sample('2023-03-02'), sample('2023-05-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(false);
    expect(result.periodBucket).toBeNull();
  });

  it('selects MONTHS_10_TO_24 at exactly 10 calendar months', () => {
    const result = runRateEngine(
      [sample('2023-01-01'), sample('2023-06-01'), sample('2023-11-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(true);
    expect(result.periodBucket).toBe('MONTHS_10_TO_24');
  });

  it('selects MONTHS_4_TO_9 one day short of 10 months', () => {
    const result = runRateEngine(
      [sample('2023-01-02'), sample('2023-06-01'), sample('2023-11-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(true);
    expect(result.periodBucket).toBe('MONTHS_4_TO_9');
  });

  it('selects MONTHS_10_TO_24 at exactly 24 calendar months', () => {
    const result = runRateEngine(
      [sample('2023-01-01'), sample('2024-01-01'), sample('2025-01-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(true);
    expect(result.periodBucket).toBe('MONTHS_10_TO_24');
  });

  it('is unavailable when 3 samples (the minimum) span more than 24 months', () => {
    const result = runRateEngine(
      [sample('2023-01-01'), sample('2023-06-01'), sample('2025-02-01')],
      'LOW_RATIO',
    );

    expect(result.rateAvailable).toBe(false);
    expect(result.periodBucket).toBeNull();
  });
});

describe('discarding older samples to fit the 24-month window', () => {
  it('drops the oldest sample when it pushes the span over 24 months, keeping >= 3', () => {
    // S1 is ~3 years before the other three — must be discarded so the
    // remaining window (S2..S4, exactly 4 months) becomes valid.
    const s1 = sample('2020-01-01', { h2: 999999 });
    const s2 = sample('2023-01-01', { h2: 100 });
    const s3 = sample('2023-03-01', { h2: 159 });
    const s4 = sample('2023-05-01', { h2: 220 });

    const result = runRateEngine([s1, s2, s3, s4], 'LOW_RATIO');

    expect(result.rateAvailable).toBe(true);
    expect(result.periodBucket).toBe('MONTHS_4_TO_9');
    expect(result.periodDays).toBe(daysBetween('2023-01-01', '2023-05-01'));
    // Slope is exactly 1 ppm/day across S2-S4; if the S1 outlier had been
    // included the computed rate would be wildly different.
    expect(result.rates.h2).toBeCloseTo(1 * DAYS_PER_YEAR, 4);
  });
});

describe('sample selection — more than six samples supplied', () => {
  it('uses only the six most recent samples', () => {
    const outlier = sample('2015-01-01', { h2: 999999 });
    const recent = [
      sample('2023-01-01', { h2: 100 }),
      sample('2023-02-01', { h2: 131 }),
      sample('2023-03-01', { h2: 159 }),
      sample('2023-04-01', { h2: 190 }),
      sample('2023-05-01', { h2: 220 }),
      sample('2023-06-01', { h2: 251 }),
    ];

    const result = runRateEngine([outlier, ...recent], 'LOW_RATIO');

    expect(result.rateAvailable).toBe(true);
    expect(result.periodBucket).toBe('MONTHS_4_TO_9');
    expect(result.periodDays).toBe(daysBetween('2023-01-01', '2023-06-01'));
    expect(result.rates.h2).toBeCloseTo(1 * DAYS_PER_YEAR, 4);
  });
});

describe('linear regression and Table 4 comparison', () => {
  // Perfectly linear per-gas concentrations across three samples spanning
  // exactly 4 months (LOW_RATIO / MONTHS_4_TO_9 thresholds: h2=50, ch4=15,
  // c2h6=15, c2h4=10, c2h2=ANY_INCREASING_RATE, co=200, co2=1750).
  const samples: RateSampleInput[] = [
    sample('2023-01-01', { h2: 100, ch4: 50, c2h6: 30, c2h4: 20, c2h2: 1, co: 200, co2: 1000 }),
    sample('2023-03-01', { h2: 159, ch4: 50.59, c2h6: 30, c2h4: 22.95, c2h2: 1, co: 170.5, co2: 1295 }),
    sample('2023-05-01', { h2: 220, ch4: 51.2, c2h6: 30, c2h4: 26, c2h2: 1, co: 140, co2: 1600 }),
  ];

  it('computes each gas rate independently via linear best fit, annualized to ppm/year', () => {
    const result = runRateEngine(samples, 'LOW_RATIO');

    expect(result.rateAvailable).toBe(true);
    expect(result.rates.h2).toBeCloseTo(1 * DAYS_PER_YEAR, 4);
    expect(result.rates.ch4).toBeCloseTo(0.01 * DAYS_PER_YEAR, 4);
    expect(result.rates.c2h6).toBeCloseTo(0, 4);
    expect(result.rates.c2h4).toBeCloseTo(0.05 * DAYS_PER_YEAR, 4);
    expect(result.rates.c2h2).toBeCloseTo(0, 4);
    expect(result.rates.co).toBeCloseTo(-0.5 * DAYS_PER_YEAR, 4);
    expect(result.rates.co2).toBeCloseTo(5 * DAYS_PER_YEAR, 4);
  });

  it('flags only the gases whose rate exceeds the applicable Table 4 threshold, in gas order', () => {
    const result = runRateEngine(samples, 'LOW_RATIO');

    expect(result.exceededThresholds).toEqual([
      { sourceTable: 'TABLE_4', gas: 'H2', actualValue: result.rates.h2, thresholdValue: 50 },
      { sourceTable: 'TABLE_4', gas: 'C2H4', actualValue: result.rates.c2h4, thresholdValue: 10 },
      { sourceTable: 'TABLE_4', gas: 'CO2', actualValue: result.rates.co2, thresholdValue: 1750 },
    ]);
  });

  it('does not flag a negative rate even though its magnitude exceeds the threshold', () => {
    const result = runRateEngine(samples, 'LOW_RATIO');

    expect(result.exceededThresholds.some((item) => item.gas === 'CO')).toBe(false);
  });
});

describe('C2H2 ANY_INCREASING_RATE special case', () => {
  it('flags any positive C2H2 rate, however small', () => {
    const samples: RateSampleInput[] = [
      sample('2023-01-01', { c2h2: 1 }),
      sample('2023-03-01', { c2h2: 1.0059 }),
      sample('2023-05-01', { c2h2: 1.012 }),
    ];

    const result = runRateEngine(samples, 'LOW_RATIO');

    expect(result.rateAvailable).toBe(true);
    expect(result.rates.c2h2).toBeGreaterThan(0);
    expect(result.exceededThresholds).toContainEqual({
      sourceTable: 'TABLE_4',
      gas: 'C2H2',
      actualValue: result.rates.c2h2,
      thresholdValue: 'ANY_INCREASING_RATE',
    });
  });

  it('does not flag a decreasing C2H2 rate', () => {
    const samples: RateSampleInput[] = [
      sample('2023-01-01', { c2h2: 2 }),
      sample('2023-03-01', { c2h2: 1.5 }),
      sample('2023-05-01', { c2h2: 1 }),
    ];

    const result = runRateEngine(samples, 'LOW_RATIO');

    expect(result.rates.c2h2).toBeLessThan(0);
    expect(result.exceededThresholds.some((item) => item.gas === 'C2H2')).toBe(false);
  });

  it('does not flag a flat (zero-slope) C2H2 rate', () => {
    const samples: RateSampleInput[] = [
      sample('2023-01-01', { c2h2: 1 }),
      sample('2023-03-01', { c2h2: 1 }),
      sample('2023-05-01', { c2h2: 1 }),
    ];

    const result = runRateEngine(samples, 'LOW_RATIO');

    expect(result.rates.c2h2).toBeCloseTo(0, 6);
    expect(result.exceededThresholds.some((item) => item.gas === 'C2H2')).toBe(false);
  });
});

describe('DEFAULT_HIGH_RATIO behaves exactly like HIGH_RATIO', () => {
  const samples: RateSampleInput[] = [
    sample('2023-01-01', { h2: 100 }),
    sample('2023-03-01', { h2: 159 }),
    sample('2023-05-01', { h2: 220 }),
  ];

  it('produces identical results for HIGH_RATIO and DEFAULT_HIGH_RATIO', () => {
    const highRatio = runRateEngine(samples, 'HIGH_RATIO');
    const defaultHighRatio = runRateEngine(samples, 'DEFAULT_HIGH_RATIO');

    expect(defaultHighRatio).toEqual(highRatio);
  });

  it.each<NormProfile>(['HIGH_RATIO', 'DEFAULT_HIGH_RATIO'])(
    'flags the H2 exceedance for %s using the HIGH_RATIO MONTHS_4_TO_9 threshold (25)',
    (profile) => {
      const result = runRateEngine(samples, profile);
      expect(result.exceededThresholds).toContainEqual({
        sourceTable: 'TABLE_4',
        gas: 'H2',
        actualValue: result.rates.h2,
        thresholdValue: 25,
      });
    },
  );
});

describe('determinism', () => {
  it('is independent of input sample order', () => {
    const samples: RateSampleInput[] = [
      sample('2023-01-01', { h2: 100, co2: 1000 }),
      sample('2023-03-01', { h2: 159, co2: 1295 }),
      sample('2023-05-01', { h2: 220, co2: 1600 }),
    ];

    const forward = runRateEngine(samples, 'LOW_RATIO');
    const shuffled = runRateEngine([samples[2], samples[0], samples[1]], 'LOW_RATIO');

    expect(shuffled).toEqual(forward);
  });
});
