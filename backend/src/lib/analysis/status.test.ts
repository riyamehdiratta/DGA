import { describe, expect, it } from 'vitest';
import { runDeltaEngine } from './delta.js';
import {
  resolveTransformerAgeCategory,
  runStatusEngine,
  type StatusEngineInput,
} from './status.js';
import type { DeltaResult, GasSampleInput, RateResult } from './types.js';

const ZERO_SAMPLE: GasSampleInput = {
  h2: 0,
  ch4: 0,
  c2h6: 0,
  c2h4: 0,
  c2h2: 0,
  co: 0,
  co2: 0,
};

function nullDelta(): DeltaResult {
  return runDeltaEngine(ZERO_SAMPLE, null);
}

function deltaFromPrevious(
  current: GasSampleInput,
  previous: GasSampleInput,
): DeltaResult {
  return runDeltaEngine(current, previous);
}

/** No sample history — the Rate Engine's real "insufficient data" result. */
const RATE_UNAVAILABLE: RateResult = {
  periodDays: 0,
  periodBucket: null,
  rates: { h2: null, ch4: null, c2h6: null, c2h4: null, c2h2: null, co: null, co2: null },
  exceededThresholds: [],
  rateAvailable: false,
};

const RATE_ALL_PASS: RateResult = {
  periodDays: 120,
  periodBucket: 'MONTHS_4_TO_9',
  rates: { h2: 10, ch4: 5, c2h6: 5, c2h4: 5, c2h2: 0, co: 50, co2: 500 },
  exceededThresholds: [],
  rateAvailable: true,
};

function rateWithExceedance(
  gas: string,
  actualValue: number,
  thresholdValue: number | 'ANY_INCREASING_RATE',
): RateResult {
  return {
    periodDays: 120,
    periodBucket: 'MONTHS_4_TO_9',
    rates: { h2: null, ch4: null, c2h6: null, c2h4: null, c2h2: null, co: null, co2: null },
    exceededThresholds: [{ sourceTable: 'TABLE_4', gas, actualValue, thresholdValue }],
    rateAvailable: true,
  };
}

function evaluate(overrides: Partial<StatusEngineInput>): ReturnType<typeof runStatusEngine> {
  return runStatusEngine({
    normProfile: 'LOW_RATIO',
    ageCategory: 'UNKNOWN',
    sample: ZERO_SAMPLE,
    delta: nullDelta(),
    rate: RATE_UNAVAILABLE,
    ...overrides,
  });
}

describe('resolveTransformerAgeCategory', () => {
  it('returns UNKNOWN when commissioning date is missing', () => {
    expect(resolveTransformerAgeCategory(null, new Date('2024-01-01'))).toBe('UNKNOWN');
  });

  it('returns UNKNOWN when sample predates commissioning', () => {
    expect(
      resolveTransformerAgeCategory(
        new Date('2020-01-01'),
        new Date('2019-01-01'),
      ),
    ).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for transformers younger than one year', () => {
    expect(
      resolveTransformerAgeCategory(
        new Date('2024-06-01'),
        new Date('2024-12-01'),
      ),
    ).toBe('UNKNOWN');
  });

  it('returns YEARS_1_TO_9 for 1–9 years in service', () => {
    expect(
      resolveTransformerAgeCategory(
        new Date('2015-01-01'),
        new Date('2020-01-01'),
      ),
    ).toBe('YEARS_1_TO_9');
  });

  it('returns YEARS_10_TO_30 for 10–30 years in service', () => {
    expect(
      resolveTransformerAgeCategory(
        new Date('1995-01-01'),
        new Date('2020-01-01'),
      ),
    ).toBe('YEARS_10_TO_30');
  });

  it('returns YEARS_OVER_30 for more than 30 years in service', () => {
    expect(
      resolveTransformerAgeCategory(
        new Date('1980-01-01'),
        new Date('2024-01-01'),
      ),
    ).toBe('YEARS_OVER_30');
  });
});

describe('STATUS_1 path', () => {
  it('assigns STATUS_1 when all concentrations and deltas are within thresholds', () => {
    const sample: GasSampleInput = {
      h2: 50,
      ch4: 40,
      c2h6: 30,
      c2h4: 20,
      c2h2: 0,
      co: 400,
      co2: 4000,
    };

    const result = evaluate({
      normProfile: 'LOW_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
      delta: nullDelta(),
    });

    expect(result.status).toBe('STATUS_1');
    expect(result.exceededThresholds).toEqual([]);
    expect(result.reasoning).toContain('All gas concentrations are within Table 1 thresholds.');
    expect(result.reasoning).toContain('All delta values are within Table 3 thresholds.');
  });

  it('assigns STATUS_1 at exact Table 1 boundaries for LOW_RATIO UNKNOWN', () => {
    const sample: GasSampleInput = {
      h2: 80,
      ch4: 90,
      c2h6: 90,
      c2h4: 50,
      c2h2: 1,
      co: 900,
      co2: 9000,
    };

    const result = evaluate({ sample });
    expect(result.status).toBe('STATUS_1');
  });

  it('assigns STATUS_1 for HIGH_RATIO when within thresholds', () => {
    const sample: GasSampleInput = {
      h2: 20,
      ch4: 10,
      c2h6: 10,
      c2h4: 40,
      c2h2: 1,
      co: 300,
      co2: 3000,
    };

    const result = evaluate({
      normProfile: 'HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });

    expect(result.status).toBe('STATUS_1');
  });

  it('assigns STATUS_1 for DEFAULT_HIGH_RATIO identical to HIGH_RATIO', () => {
    const sample: GasSampleInput = {
      h2: 20,
      ch4: 10,
      c2h6: 10,
      c2h4: 40,
      c2h2: 1,
      co: 300,
      co2: 3000,
    };

    const highRatio = evaluate({
      normProfile: 'HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });
    const defaultHighRatio = evaluate({
      normProfile: 'DEFAULT_HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });

    expect(defaultHighRatio).toEqual(highRatio);
    expect(defaultHighRatio.status).toBe('STATUS_1');
  });

  it('assigns STATUS_1 for YEARS_1_TO_9 age-specific Table 1 thresholds', () => {
    const sample: GasSampleInput = {
      h2: 75,
      ch4: 45,
      c2h6: 30,
      c2h4: 20,
      c2h2: 1,
      co: 900,
      co2: 5000,
    };

    const result = evaluate({
      ageCategory: 'YEARS_1_TO_9',
      sample,
    });

    expect(result.status).toBe('STATUS_1');
  });
});

describe('STATUS_2 path', () => {
  it('assigns STATUS_2 when Table 1 is exceeded but Table 2 is not', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 81,
    };

    const result = evaluate({ sample });

    expect(result.status).toBe('STATUS_2');
    expect(result.exceededThresholds).toEqual([
      {
        sourceTable: 'TABLE_1',
        gas: 'H2',
        actualValue: 81,
        thresholdValue: 80,
      },
    ]);
    expect(result.reasoning.some((line) => line.includes('STATUS_1 not satisfied'))).toBe(true);
  });

  it('assigns STATUS_2 at Table 2 boundary (concentration equals Table 2 threshold)', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 200,
    };

    const result = evaluate({ sample });

    expect(result.status).toBe('STATUS_2');
    expect(result.exceededThresholds.every((item) => item.sourceTable !== 'TABLE_2')).toBe(true);
  });

  it('assigns STATUS_2 when Table 3 delta is exceeded but Table 2 is not', () => {
    const current: GasSampleInput = { ...ZERO_SAMPLE, h2: 41 };
    const previous: GasSampleInput = { ...ZERO_SAMPLE, h2: 0 };

    const result = evaluate({
      sample: current,
      delta: deltaFromPrevious(current, previous),
    });

    expect(result.status).toBe('STATUS_2');
    expect(result.exceededThresholds).toEqual([
      {
        sourceTable: 'TABLE_3',
        gas: 'H2',
        actualValue: 41,
        thresholdValue: 40,
      },
    ]);
  });

  it('assigns STATUS_2 for HIGH_RATIO when only Table 1 is exceeded', () => {
    const sample: GasSampleInput = {
      h2: 41,
      ch4: 10,
      c2h6: 10,
      c2h4: 40,
      c2h2: 1,
      co: 300,
      co2: 3000,
    };

    const result = evaluate({
      normProfile: 'HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });

    expect(result.status).toBe('STATUS_2');
    expect(result.exceededThresholds[0]?.sourceTable).toBe('TABLE_1');
  });

  it('assigns STATUS_2 using YEARS_OVER_30 age-specific Table 1 limits', () => {
    const sample: GasSampleInput = {
      h2: 101,
      ch4: 50,
      c2h6: 50,
      c2h4: 50,
      c2h2: 0,
      co: 500,
      co2: 5000,
    };

    const result = evaluate({
      ageCategory: 'YEARS_OVER_30',
      sample,
    });

    expect(result.status).toBe('STATUS_2');
    expect(result.exceededThresholds[0]).toMatchObject({
      sourceTable: 'TABLE_1',
      gas: 'H2',
      actualValue: 101,
      thresholdValue: 100,
    });
  });
});

describe('STATUS_3 path', () => {
  it('assigns STATUS_3 when any gas exceeds Table 2', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 201,
    };

    const result = evaluate({ sample });

    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds).toEqual([
      {
        sourceTable: 'TABLE_2',
        gas: 'H2',
        actualValue: 201,
        thresholdValue: 200,
      },
    ]);
    expect(result.reasoning.some((line) => line.includes('Potential concern'))).toBe(true);
  });

  it('assigns STATUS_3 immediately above Table 2 boundary', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 200.1,
    };

    const result = evaluate({ sample });
    expect(result.status).toBe('STATUS_3');
  });

  it('assigns STATUS_3 for HIGH_RATIO Table 2 exceedance', () => {
    const sample: GasSampleInput = {
      h2: 91,
      ch4: 10,
      c2h6: 10,
      c2h4: 40,
      c2h2: 1,
      co: 300,
      co2: 3000,
    };

    const result = evaluate({
      normProfile: 'HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });

    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds[0]).toMatchObject({
      sourceTable: 'TABLE_2',
      gas: 'H2',
      thresholdValue: 90,
    });
  });

  it('assigns STATUS_3 for DEFAULT_HIGH_RATIO same as HIGH_RATIO exceedance', () => {
    const sample: GasSampleInput = {
      h2: 91,
      ch4: 10,
      c2h6: 10,
      c2h4: 40,
      c2h2: 1,
      co: 300,
      co2: 3000,
    };

    const highRatio = evaluate({
      normProfile: 'HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });
    const defaultHighRatio = evaluate({
      normProfile: 'DEFAULT_HIGH_RATIO',
      ageCategory: 'UNKNOWN',
      sample,
    });

    expect(defaultHighRatio.status).toBe('STATUS_3');
    expect(defaultHighRatio.exceededThresholds).toEqual(highRatio.exceededThresholds);
  });

  it('assigns STATUS_3 using YEARS_1_TO_9 age-specific Table 2 limits', () => {
    const sample: GasSampleInput = {
      h2: 50,
      ch4: 101,
      c2h6: 30,
      c2h4: 20,
      c2h2: 0,
      co: 500,
      co2: 5000,
    };

    const result = evaluate({
      ageCategory: 'YEARS_1_TO_9',
      sample,
    });

    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds).toContainEqual({
      sourceTable: 'TABLE_2',
      gas: 'CH4',
      actualValue: 101,
      thresholdValue: 100,
    });
  });
});

describe('C2H2 ANY_INCREASE handling', () => {
  it('treats any positive C2H2 delta as a Table 3 exceedance', () => {
    const current: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 1 };
    const previous: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 0.5 };

    const result = evaluate({
      sample: current,
      delta: deltaFromPrevious(current, previous),
    });

    expect(result.status).toBe('STATUS_2');
    expect(result.exceededThresholds).toContainEqual({
      sourceTable: 'TABLE_3',
      gas: 'C2H2',
      actualValue: 0.5,
      thresholdValue: 'ANY_INCREASE',
    });
  });

  it('allows zero C2H2 delta for STATUS_1', () => {
    const current: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 1 };
    const previous: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 1 };

    const result = evaluate({
      sample: current,
      delta: deltaFromPrevious(current, previous),
    });

    expect(result.status).toBe('STATUS_1');
  });

  it('allows null C2H2 delta when no previous sample exists', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 1 };

    const result = evaluate({
      sample,
      delta: nullDelta(),
    });

    expect(result.status).toBe('STATUS_1');
  });

  it('applies ANY_INCREASE for HIGH_RATIO profile', () => {
    const current: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 2 };
    const previous: GasSampleInput = { ...ZERO_SAMPLE, c2h2: 1 };

    const result = evaluate({
      normProfile: 'HIGH_RATIO',
      sample: current,
      delta: deltaFromPrevious(current, previous),
    });

    expect(result.exceededThresholds).toContainEqual({
      sourceTable: 'TABLE_3',
      gas: 'C2H2',
      actualValue: 1,
      thresholdValue: 'ANY_INCREASE',
    });
  });
});

describe('Table 4 integration (Rate Engine)', () => {
  it('no longer exposes a rateEvaluationPending flag', () => {
    const result = evaluate({});
    expect(result).not.toHaveProperty('rateEvaluationPending');
  });

  it('does not use the old "pending" rate-evaluation language', () => {
    for (const result of [
      evaluate({}),
      evaluate({ sample: { ...ZERO_SAMPLE, h2: 81 } }),
      evaluate({ sample: { ...ZERO_SAMPLE, h2: 201 } }),
    ]) {
      expect(result.reasoning.some((line) => line.includes('not yet implemented'))).toBe(false);
      expect(result.reasoning.some((line) => line.includes('is pending'))).toBe(false);
    }
  });

  it('STATUS_1: Table 4 is vacuously satisfied when the Rate Engine has no valid window', () => {
    const result = evaluate({ rate: RATE_UNAVAILABLE });

    expect(result.status).toBe('STATUS_1');
    expect(
      result.reasoning.some((line) => line.includes('Table 4 rate evaluation unavailable')),
    ).toBe(true);
  });

  it('STATUS_1 when the Rate Engine ran and no gas exceeded Table 4', () => {
    const result = evaluate({ rate: RATE_ALL_PASS });

    expect(result.status).toBe('STATUS_1');
    expect(result.reasoning).toContain('All gas generation rates are within Table 4 thresholds.');
  });

  it('a Table 4 exceedance alone (Table 1/2/3 clean) triggers STATUS_3, never STATUS_1 or STATUS_2', () => {
    const sample: GasSampleInput = {
      h2: 50,
      ch4: 40,
      c2h6: 30,
      c2h4: 20,
      c2h2: 0,
      co: 400,
      co2: 4000,
    };
    const rate = rateWithExceedance('H2', 60, 50);

    const result = evaluate({ sample, rate });

    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds).toEqual([
      { sourceTable: 'TABLE_4', gas: 'H2', actualValue: 60, thresholdValue: 50 },
    ]);
    expect(result.reasoning.some((line) => line.includes('Potential concern'))).toBe(true);
    expect(
      result.reasoning.some((line) =>
        line.includes('H2 (60 ppm) exceeds TABLE_4 threshold (50 ppm)'),
      ),
    ).toBe(true);
  });

  it('a Table 4 ANY_INCREASING_RATE exceedance (C2H2) triggers STATUS_3', () => {
    const sample: GasSampleInput = {
      h2: 50,
      ch4: 40,
      c2h6: 30,
      c2h4: 20,
      c2h2: 0,
      co: 400,
      co2: 4000,
    };
    const rate = rateWithExceedance('C2H2', 0.01, 'ANY_INCREASING_RATE');

    const result = evaluate({ sample, rate });

    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds).toContainEqual({
      sourceTable: 'TABLE_4',
      gas: 'C2H2',
      actualValue: 0.01,
      thresholdValue: 'ANY_INCREASING_RATE',
    });
  });

  it('combines a Table 2 exceedance and a Table 4 exceedance into one STATUS_3 result', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 201 };
    const rate = rateWithExceedance('CO2', 2000, 1750);

    const result = evaluate({ sample, rate });

    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds).toEqual([
      { sourceTable: 'TABLE_2', gas: 'H2', actualValue: 201, thresholdValue: 200 },
      { sourceTable: 'TABLE_4', gas: 'CO2', actualValue: 2000, thresholdValue: 1750 },
    ]);
  });

  it('STATUS_2 reasoning still reports Table 4 status when Table 4 itself passed', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 81 };

    const result = evaluate({ sample, rate: RATE_ALL_PASS });

    expect(result.status).toBe('STATUS_2');
    expect(result.reasoning).toContain('All gas generation rates are within Table 4 thresholds.');
  });
});

describe('evaluation order', () => {
  it('returns STATUS_1 without evaluating STATUS_3 when STATUS_1 is satisfied', () => {
    const result = evaluate({
      sample: {
        h2: 50,
        ch4: 40,
        c2h6: 30,
        c2h4: 20,
        c2h2: 0,
        co: 400,
        co2: 4000,
      },
    });

    expect(result.status).toBe('STATUS_1');
    expect(result.exceededThresholds).toHaveLength(0);
  });

  it('returns STATUS_3 when both Table 1 and Table 2 are exceeded', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 250,
    };

    const result = evaluate({ sample });
    expect(result.status).toBe('STATUS_3');
    expect(result.exceededThresholds).toHaveLength(1);
    expect(result.exceededThresholds[0]?.sourceTable).toBe('TABLE_2');
  });
});
