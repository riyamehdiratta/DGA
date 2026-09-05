import { describe, expect, it } from 'vitest';
import {
  getTable1Threshold,
  getTable2Threshold,
  getTable3Threshold,
  getTable4Threshold,
} from './lookup.js';
import { TABLE_1, TABLE_2, TABLE_3, TABLE_4 } from './tables.js';
import {
  GAS_KEYS,
  NORM_PROFILES,
  PERIOD_BUCKETS,
  TRANSFORMER_AGE_CATEGORIES,
  type GasKey,
  type IeeeThreshold,
  type NormProfile,
  type PeriodBucket,
  type TransformerAgeCategory,
} from './types.js';

function expectPpm(threshold: IeeeThreshold, ppm: number): void {
  expect(threshold).toEqual({ ppm });
}

function expectAnyIncrease(threshold: IeeeThreshold): void {
  expect(threshold).toEqual({ anyIncrease: true });
}

function expectAnyIncreasingRate(threshold: IeeeThreshold): void {
  expect(threshold).toEqual({ anyIncreasingRate: true });
}

function assertNoPlaceholders(threshold: IeeeThreshold): void {
  expect(threshold.ppm).not.toBe(-1);
  expect(threshold.ppm).not.toBeNull();
  const hasKind =
    threshold.anyIncrease === true ||
    threshold.anyIncreasingRate === true ||
    (typeof threshold.ppm === 'number' && Number.isFinite(threshold.ppm));
  expect(hasKind).toBe(true);
}

describe('IEEE table completeness', () => {
  it('TABLE_1 contains every profile, age bucket, and gas key without placeholders', () => {
    for (const profile of NORM_PROFILES) {
      for (const age of TRANSFORMER_AGE_CATEGORIES) {
        for (const gas of GAS_KEYS) {
          assertNoPlaceholders(TABLE_1[profile][age][gas]);
        }
      }
    }
  });

  it('TABLE_2 contains every profile, age bucket, and gas key without placeholders', () => {
    for (const profile of NORM_PROFILES) {
      for (const age of TRANSFORMER_AGE_CATEGORIES) {
        for (const gas of GAS_KEYS) {
          assertNoPlaceholders(TABLE_2[profile][age][gas]);
        }
      }
    }
  });

  it('TABLE_3 contains every profile and gas key without placeholders', () => {
    for (const profile of NORM_PROFILES) {
      for (const gas of GAS_KEYS) {
        assertNoPlaceholders(TABLE_3[profile][gas]);
      }
    }
  });

  it('TABLE_4 contains every profile, period bucket, and gas key without placeholders', () => {
    for (const profile of NORM_PROFILES) {
      for (const period of PERIOD_BUCKETS) {
        for (const gas of GAS_KEYS) {
          assertNoPlaceholders(TABLE_4[profile][period][gas]);
        }
      }
    }
  });
});

describe('IEEE lookup API', () => {
  it('getTable1Threshold returns a value for every profile, age, and gas', () => {
    for (const profile of NORM_PROFILES) {
      for (const age of TRANSFORMER_AGE_CATEGORIES) {
        for (const gas of GAS_KEYS) {
          assertNoPlaceholders(getTable1Threshold(profile, age, gas));
          assertNoPlaceholders(getTable1Threshold({ profile, age, gas }));
        }
      }
    }
  });

  it('getTable2Threshold returns a value for every profile, age, and gas', () => {
    for (const profile of NORM_PROFILES) {
      for (const age of TRANSFORMER_AGE_CATEGORIES) {
        for (const gas of GAS_KEYS) {
          assertNoPlaceholders(getTable2Threshold(profile, age, gas));
          assertNoPlaceholders(getTable2Threshold({ profile, age, gas }));
        }
      }
    }
  });

  it('getTable3Threshold returns a value for every profile and gas', () => {
    for (const profile of NORM_PROFILES) {
      for (const gas of GAS_KEYS) {
        assertNoPlaceholders(getTable3Threshold(profile, gas));
        assertNoPlaceholders(getTable3Threshold({ profile, gas }));
      }
    }
  });

  it('getTable4Threshold returns a value for every profile, period, and gas', () => {
    for (const profile of NORM_PROFILES) {
      for (const period of PERIOD_BUCKETS) {
        for (const gas of GAS_KEYS) {
          assertNoPlaceholders(getTable4Threshold(profile, period, gas));
          assertNoPlaceholders(getTable4Threshold({ profile, period, gas }));
        }
      }
    }
  });

  it('lookup results match direct table access', () => {
    const profile = NORM_PROFILES[0];
    const age = TRANSFORMER_AGE_CATEGORIES[1];
    const gas = GAS_KEYS[2];
    const period = PERIOD_BUCKETS[0];

    expect(getTable1Threshold(profile, age, gas)).toEqual(TABLE_1[profile][age][gas]);
    expect(getTable2Threshold(profile, age, gas)).toEqual(TABLE_2[profile][age][gas]);
    expect(getTable3Threshold(profile, gas)).toEqual(TABLE_3[profile][gas]);
    expect(getTable4Threshold(profile, period, gas)).toEqual(TABLE_4[profile][period][gas]);
  });
});

describe('TABLE 1 — LOW_RATIO values (IEEE C57.104-2019)', () => {
  const profile: NormProfile = 'LOW_RATIO';

  const cases: Array<[TransformerAgeCategory, GasKey, number]> = [
    ['UNKNOWN', 'h2', 80],
    ['UNKNOWN', 'ch4', 90],
    ['UNKNOWN', 'c2h6', 90],
    ['UNKNOWN', 'c2h4', 50],
    ['UNKNOWN', 'c2h2', 1],
    ['UNKNOWN', 'co', 900],
    ['UNKNOWN', 'co2', 9000],
    ['YEARS_1_TO_9', 'h2', 75],
    ['YEARS_1_TO_9', 'ch4', 45],
    ['YEARS_1_TO_9', 'c2h6', 30],
    ['YEARS_1_TO_9', 'c2h4', 20],
    ['YEARS_10_TO_30', 'co2', 10000],
    ['YEARS_OVER_30', 'h2', 100],
    ['YEARS_OVER_30', 'c2h6', 150],
  ];

  it.each(cases)('age %s gas %s = %i ppm', (age, gas, ppm) => {
    expectPpm(getTable1Threshold(profile, age, gas), ppm);
  });
});

describe('TABLE 1 — HIGH_RATIO values (IEEE C57.104-2019)', () => {
  const profile: NormProfile = 'HIGH_RATIO';

  const cases: Array<[TransformerAgeCategory, GasKey, number]> = [
    ['UNKNOWN', 'h2', 40],
    ['UNKNOWN', 'ch4', 20],
    ['UNKNOWN', 'c2h6', 15],
    ['UNKNOWN', 'c2h4', 50],
    ['UNKNOWN', 'c2h2', 2],
    ['UNKNOWN', 'co', 500],
    ['UNKNOWN', 'co2', 5000],
    ['YEARS_1_TO_9', 'c2h4', 25],
    ['YEARS_1_TO_9', 'co2', 3500],
    ['YEARS_10_TO_30', 'c2h4', 60],
    ['YEARS_10_TO_30', 'co2', 5500],
    ['YEARS_OVER_30', 'c2h4', 60],
  ];

  it.each(cases)('age %s gas %s = %i ppm', (age, gas, ppm) => {
    expectPpm(getTable1Threshold(profile, age, gas), ppm);
  });
});

describe('TABLE 2 — LOW_RATIO values (IEEE C57.104-2019)', () => {
  const profile: NormProfile = 'LOW_RATIO';

  const cases: Array<[TransformerAgeCategory, GasKey, number]> = [
    ['UNKNOWN', 'h2', 200],
    ['UNKNOWN', 'ch4', 150],
    ['UNKNOWN', 'c2h2', 2],
    ['UNKNOWN', 'co2', 12500],
    ['YEARS_1_TO_9', 'c2h6', 70],
    ['YEARS_1_TO_9', 'co2', 7000],
    ['YEARS_10_TO_30', 'c2h4', 95],
    ['YEARS_OVER_30', 'c2h2', 4],
    ['YEARS_OVER_30', 'c2h6', 250],
  ];

  it.each(cases)('age %s gas %s = %i ppm', (age, gas, ppm) => {
    expectPpm(getTable2Threshold(profile, age, gas), ppm);
  });
});

describe('TABLE 2 — HIGH_RATIO values (IEEE C57.104-2019)', () => {
  const profile: NormProfile = 'HIGH_RATIO';

  const cases: Array<[TransformerAgeCategory, GasKey, number]> = [
    ['UNKNOWN', 'h2', 90],
    ['UNKNOWN', 'ch4', 50],
    ['UNKNOWN', 'c2h4', 100],
    ['UNKNOWN', 'c2h2', 7],
    ['YEARS_1_TO_9', 'ch4', 60],
    ['YEARS_1_TO_9', 'co2', 5000],
    ['YEARS_10_TO_30', 'c2h4', 125],
    ['YEARS_OVER_30', 'ch4', 30],
    ['YEARS_OVER_30', 'co2', 8000],
  ];

  it.each(cases)('age %s gas %s = %i ppm', (age, gas, ppm) => {
    expectPpm(getTable2Threshold(profile, age, gas), ppm);
  });
});

describe('DEFAULT_HIGH_RATIO matches HIGH_RATIO', () => {
  it('TABLE_1 DEFAULT_HIGH_RATIO equals HIGH_RATIO for every age and gas', () => {
    for (const age of TRANSFORMER_AGE_CATEGORIES) {
      for (const gas of GAS_KEYS) {
        expect(getTable1Threshold('DEFAULT_HIGH_RATIO', age, gas)).toEqual(
          getTable1Threshold('HIGH_RATIO', age, gas),
        );
      }
    }
  });

  it('TABLE_2 DEFAULT_HIGH_RATIO equals HIGH_RATIO for every age and gas', () => {
    for (const age of TRANSFORMER_AGE_CATEGORIES) {
      for (const gas of GAS_KEYS) {
        expect(getTable2Threshold('DEFAULT_HIGH_RATIO', age, gas)).toEqual(
          getTable2Threshold('HIGH_RATIO', age, gas),
        );
      }
    }
  });

  it('TABLE_3 DEFAULT_HIGH_RATIO equals HIGH_RATIO for every gas', () => {
    for (const gas of GAS_KEYS) {
      expect(getTable3Threshold('DEFAULT_HIGH_RATIO', gas)).toEqual(
        getTable3Threshold('HIGH_RATIO', gas),
      );
    }
  });

  it('TABLE_4 DEFAULT_HIGH_RATIO equals HIGH_RATIO for every period and gas', () => {
    for (const period of PERIOD_BUCKETS) {
      for (const gas of GAS_KEYS) {
        expect(getTable4Threshold('DEFAULT_HIGH_RATIO', period, gas)).toEqual(
          getTable4Threshold('HIGH_RATIO', period, gas),
        );
      }
    }
  });
});

describe('TABLE 3 — ANY_INCREASE for C₂H₂', () => {
  it('LOW_RATIO c2h2 uses ANY_INCREASE', () => {
    expectAnyIncrease(getTable3Threshold('LOW_RATIO', 'c2h2'));
  });

  it('HIGH_RATIO c2h2 uses ANY_INCREASE', () => {
    expectAnyIncrease(getTable3Threshold('HIGH_RATIO', 'c2h2'));
  });

  it('DEFAULT_HIGH_RATIO c2h2 uses ANY_INCREASE', () => {
    expectAnyIncrease(getTable3Threshold('DEFAULT_HIGH_RATIO', 'c2h2'));
  });

  it('LOW_RATIO numeric delta thresholds match IEEE Table 3', () => {
    expectPpm(getTable3Threshold('LOW_RATIO', 'h2'), 40);
    expectPpm(getTable3Threshold('LOW_RATIO', 'ch4'), 30);
    expectPpm(getTable3Threshold('LOW_RATIO', 'c2h6'), 25);
    expectPpm(getTable3Threshold('LOW_RATIO', 'c2h4'), 20);
    expectPpm(getTable3Threshold('LOW_RATIO', 'co'), 250);
    expectPpm(getTable3Threshold('LOW_RATIO', 'co2'), 2500);
  });

  it('HIGH_RATIO numeric delta thresholds match IEEE Table 3', () => {
    expectPpm(getTable3Threshold('HIGH_RATIO', 'h2'), 25);
    expectPpm(getTable3Threshold('HIGH_RATIO', 'ch4'), 10);
    expectPpm(getTable3Threshold('HIGH_RATIO', 'c2h6'), 7);
    expectPpm(getTable3Threshold('HIGH_RATIO', 'c2h4'), 20);
    expectPpm(getTable3Threshold('HIGH_RATIO', 'co'), 175);
    expectPpm(getTable3Threshold('HIGH_RATIO', 'co2'), 1750);
  });
});

describe('TABLE 4 — ANY_INCREASING_RATE for C₂H₂', () => {
  for (const profile of ['LOW_RATIO', 'HIGH_RATIO', 'DEFAULT_HIGH_RATIO'] as const) {
    for (const period of PERIOD_BUCKETS) {
      it(`${profile} ${period} c2h2 uses ANY_INCREASING_RATE`, () => {
        expectAnyIncreasingRate(getTable4Threshold(profile, period, 'c2h2'));
      });
    }
  }

  it('LOW_RATIO MONTHS_4_TO_9 rate thresholds match IEEE Table 4', () => {
    const period: PeriodBucket = 'MONTHS_4_TO_9';
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'h2'), 50);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'ch4'), 15);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'c2h6'), 15);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'c2h4'), 10);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'co'), 200);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'co2'), 1750);
  });

  it('LOW_RATIO MONTHS_10_TO_24 rate thresholds match IEEE Table 4', () => {
    const period: PeriodBucket = 'MONTHS_10_TO_24';
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'h2'), 20);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'ch4'), 10);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'c2h6'), 9);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'c2h4'), 7);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'co'), 100);
    expectPpm(getTable4Threshold('LOW_RATIO', period, 'co2'), 1000);
  });

  it('HIGH_RATIO MONTHS_4_TO_9 rate thresholds match IEEE Table 4', () => {
    const period: PeriodBucket = 'MONTHS_4_TO_9';
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'h2'), 25);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'ch4'), 4);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'c2h6'), 3);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'c2h4'), 7);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'co'), 100);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'co2'), 1000);
  });

  it('HIGH_RATIO MONTHS_10_TO_24 rate thresholds match IEEE Table 4', () => {
    const period: PeriodBucket = 'MONTHS_10_TO_24';
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'h2'), 10);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'ch4'), 3);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'c2h6'), 2);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'c2h4'), 5);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'co'), 80);
    expectPpm(getTable4Threshold('HIGH_RATIO', period, 'co2'), 800);
  });
});
