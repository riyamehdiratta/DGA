import type {
  GasKey,
  IeeeThreshold,
  PeriodBucket,
  Table1,
  Table2,
  Table3,
  Table4,
  TransformerAgeCategory,
} from './types.js';

type GasValues = Record<GasKey, number | 'ANY_INCREASE' | 'ANY_INCREASING_RATE'>;

function ppm(value: number): IeeeThreshold {
  return { ppm: value };
}

function anyIncrease(): IeeeThreshold {
  return { anyIncrease: true };
}

function anyIncreasingRate(): IeeeThreshold {
  return { anyIncreasingRate: true };
}

function gasRow(values: GasValues): Record<GasKey, IeeeThreshold> {
  return {
    h2: values.h2 === 'ANY_INCREASE' ? anyIncrease() : values.h2 === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.h2),
    ch4: values.ch4 === 'ANY_INCREASE' ? anyIncrease() : values.ch4 === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.ch4),
    c2h6: values.c2h6 === 'ANY_INCREASE' ? anyIncrease() : values.c2h6 === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.c2h6),
    c2h4: values.c2h4 === 'ANY_INCREASE' ? anyIncrease() : values.c2h4 === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.c2h4),
    c2h2: values.c2h2 === 'ANY_INCREASE' ? anyIncrease() : values.c2h2 === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.c2h2),
    co: values.co === 'ANY_INCREASE' ? anyIncrease() : values.co === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.co),
    co2: values.co2 === 'ANY_INCREASE' ? anyIncrease() : values.co2 === 'ANY_INCREASING_RATE' ? anyIncreasingRate() : ppm(values.co2),
  };
}

function ageGasMatrix(
  rows: Record<TransformerAgeCategory, GasValues>,
): Record<TransformerAgeCategory, Record<GasKey, IeeeThreshold>> {
  return {
    UNKNOWN: gasRow(rows.UNKNOWN),
    YEARS_1_TO_9: gasRow(rows.YEARS_1_TO_9),
    YEARS_10_TO_30: gasRow(rows.YEARS_10_TO_30),
    YEARS_OVER_30: gasRow(rows.YEARS_OVER_30),
  };
}

const TABLE_1_LOW_RATIO = ageGasMatrix({
  UNKNOWN: { h2: 80, ch4: 90, c2h6: 90, c2h4: 50, c2h2: 1, co: 900, co2: 9000 },
  YEARS_1_TO_9: { h2: 75, ch4: 45, c2h6: 30, c2h4: 20, c2h2: 1, co: 900, co2: 5000 },
  YEARS_10_TO_30: { h2: 75, ch4: 90, c2h6: 90, c2h4: 50, c2h2: 1, co: 900, co2: 10000 },
  YEARS_OVER_30: { h2: 100, ch4: 110, c2h6: 150, c2h4: 90, c2h2: 1, co: 900, co2: 10000 },
});

const TABLE_1_HIGH_RATIO = ageGasMatrix({
  UNKNOWN: { h2: 40, ch4: 20, c2h6: 15, c2h4: 50, c2h2: 2, co: 500, co2: 5000 },
  YEARS_1_TO_9: { h2: 40, ch4: 20, c2h6: 15, c2h4: 25, c2h2: 2, co: 500, co2: 3500 },
  YEARS_10_TO_30: { h2: 40, ch4: 20, c2h6: 15, c2h4: 60, c2h2: 2, co: 500, co2: 5500 },
  YEARS_OVER_30: { h2: 40, ch4: 20, c2h6: 15, c2h4: 60, c2h2: 2, co: 500, co2: 5500 },
});

/** IEEE C57.104-2019 Table 1 — 90th percentile gas concentrations (µL/L). */
export const TABLE_1: Table1 = {
  LOW_RATIO: TABLE_1_LOW_RATIO,
  HIGH_RATIO: TABLE_1_HIGH_RATIO,
  DEFAULT_HIGH_RATIO: TABLE_1_HIGH_RATIO,
};

const TABLE_2_LOW_RATIO = ageGasMatrix({
  UNKNOWN: { h2: 200, ch4: 150, c2h6: 175, c2h4: 100, c2h2: 2, co: 1100, co2: 12500 },
  YEARS_1_TO_9: { h2: 200, ch4: 100, c2h6: 70, c2h4: 40, c2h2: 2, co: 1100, co2: 7000 },
  YEARS_10_TO_30: { h2: 200, ch4: 150, c2h6: 175, c2h4: 95, c2h2: 2, co: 1100, co2: 14000 },
  YEARS_OVER_30: { h2: 200, ch4: 200, c2h6: 250, c2h4: 175, c2h2: 4, co: 1100, co2: 14000 },
});

const TABLE_2_HIGH_RATIO = ageGasMatrix({
  UNKNOWN: { h2: 90, ch4: 50, c2h6: 40, c2h4: 100, c2h2: 7, co: 600, co2: 7000 },
  YEARS_1_TO_9: { h2: 90, ch4: 60, c2h6: 30, c2h4: 80, c2h2: 7, co: 600, co2: 5000 },
  YEARS_10_TO_30: { h2: 90, ch4: 60, c2h6: 40, c2h4: 125, c2h2: 7, co: 600, co2: 8000 },
  YEARS_OVER_30: { h2: 90, ch4: 30, c2h6: 40, c2h4: 125, c2h2: 7, co: 600, co2: 8000 },
});

/** IEEE C57.104-2019 Table 2 — 95th percentile gas concentrations (µL/L). */
export const TABLE_2: Table2 = {
  LOW_RATIO: TABLE_2_LOW_RATIO,
  HIGH_RATIO: TABLE_2_HIGH_RATIO,
  DEFAULT_HIGH_RATIO: TABLE_2_HIGH_RATIO,
};

const TABLE_3_LOW_RATIO = gasRow({
  h2: 40,
  ch4: 30,
  c2h6: 25,
  c2h4: 20,
  c2h2: 'ANY_INCREASE',
  co: 250,
  co2: 2500,
});

const TABLE_3_HIGH_RATIO = gasRow({
  h2: 25,
  ch4: 10,
  c2h6: 7,
  c2h4: 20,
  c2h2: 'ANY_INCREASE',
  co: 175,
  co2: 1750,
});

/** IEEE C57.104-2019 Table 3 — 95th percentile absolute deltas between successive samples (µL/L). */
export const TABLE_3: Table3 = {
  LOW_RATIO: TABLE_3_LOW_RATIO,
  HIGH_RATIO: TABLE_3_HIGH_RATIO,
  DEFAULT_HIGH_RATIO: TABLE_3_HIGH_RATIO,
};

function periodGasMatrix(
  rows: Record<PeriodBucket, GasValues>,
): Record<PeriodBucket, Record<GasKey, IeeeThreshold>> {
  return {
    MONTHS_4_TO_9: gasRow(rows.MONTHS_4_TO_9),
    MONTHS_10_TO_24: gasRow(rows.MONTHS_10_TO_24),
  };
}

const TABLE_4_LOW_RATIO = periodGasMatrix({
  MONTHS_4_TO_9: { h2: 50, ch4: 15, c2h6: 15, c2h4: 10, c2h2: 'ANY_INCREASING_RATE', co: 200, co2: 1750 },
  MONTHS_10_TO_24: { h2: 20, ch4: 10, c2h6: 9, c2h4: 7, c2h2: 'ANY_INCREASING_RATE', co: 100, co2: 1000 },
});

const TABLE_4_HIGH_RATIO = periodGasMatrix({
  MONTHS_4_TO_9: { h2: 25, ch4: 4, c2h6: 3, c2h4: 7, c2h2: 'ANY_INCREASING_RATE', co: 100, co2: 1000 },
  MONTHS_10_TO_24: { h2: 10, ch4: 3, c2h6: 2, c2h4: 5, c2h2: 'ANY_INCREASING_RATE', co: 80, co2: 800 },
});

/** IEEE C57.104-2019 Table 4 — 95th percentile multi-point generation rates (µL/L per year). */
export const TABLE_4: Table4 = {
  LOW_RATIO: TABLE_4_LOW_RATIO,
  HIGH_RATIO: TABLE_4_HIGH_RATIO,
  DEFAULT_HIGH_RATIO: TABLE_4_HIGH_RATIO,
};
