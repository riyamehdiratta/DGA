import { describe, expect, it } from 'vitest';
import { runDoernenburgEngine } from './doernenburg.js';
import type { GasSampleInput } from './types.js';

const BASE_SAMPLE: GasSampleInput = {
  h2: 0,
  ch4: 0,
  c2h6: 0,
  c2h4: 0,
  c2h2: 0,
  co: 0,
  co2: 0,
};

describe('Division Rules — safe floating-point division', () => {
  it('returns r1 = null when H2 (the R1 denominator) is zero', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 0, ch4: 5, c2h6: 1, c2h4: 1, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBeNull();
    expect(result.reasoning[0]).toContain('null');
  });

  it('returns r2 = null when C2H4 (the R2 denominator) is zero', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 20, c2h6: 5, c2h4: 0, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r2).toBeNull();
  });

  it('returns r3 = null when CH4 (the R3 denominator) is zero', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 0, c2h6: 5, c2h4: 10, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r3).toBeNull();
    // r1 = ch4/h2 = 0/10 = 0, a valid (non-null) value, since h2 (the denominator) is non-zero.
    expect(result.ratios.r1).toBe(0);
  });

  it('returns r4 = null when C2H2 (the R4 denominator) is zero', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 20, c2h6: 5, c2h4: 10, c2h2: 0 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r4).toBeNull();
    // r2 and r3 are valid zero values, since c2h2 is their numerator, not denominator.
    expect(result.ratios.r2).toBe(0);
    expect(result.ratios.r3).toBe(0);
  });

  it('never throws for an all-zero sample', () => {
    expect(() => runDoernenburgEngine(BASE_SAMPLE)).not.toThrow();
    const result = runDoernenburgEngine(BASE_SAMPLE);
    expect(result.ratios).toEqual({ r1: null, r2: null, r3: null, r4: null });
    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });
});

describe('THERMAL_DECOMPOSITION', () => {
  it('diagnoses THERMAL_DECOMPOSITION when R1 > 1.0, R2 < 0.75, R3 < 0.3, R4 > 0.4', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 20, c2h6: 5, c2h4: 10, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBeCloseTo(2.0);
    expect(result.ratios.r2).toBeCloseTo(0.1);
    expect(result.ratios.r3).toBeCloseTo(0.05);
    expect(result.ratios.r4).toBeCloseTo(5.0);
    expect(result.diagnosis).toBe('THERMAL_DECOMPOSITION');
  });

  it('does not match when a required ratio is null (R2 blocked by zero C2H4)', () => {
    // Same R1/R3/R4 shape as the matching case above, but C2H4 = 0 nulls R2.
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 20, c2h6: 5, c2h4: 0, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r2).toBeNull();
    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });
});

describe('CORONA', () => {
  it('diagnoses CORONA when R1 < 0.1, R3 < 0.3, R4 > 0.4 (R2 not significant)', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 100, ch4: 5, c2h6: 5, c2h4: 1, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBeCloseTo(0.05);
    expect(result.ratios.r3).toBeCloseTo(0.2);
    expect(result.ratios.r4).toBeCloseTo(5.0);
    // R2 = 1.0 here — well outside Thermal Decomposition's (<0.75) or Arcing's
    // (>0.75, but R1 disqualifies Arcing anyway) numeric bounds — yet CORONA
    // still matches, because R2 is not a required condition for CORONA.
    expect(result.ratios.r2).toBeCloseTo(1.0);
    expect(result.diagnosis).toBe('CORONA');
    expect(result.reasoning.some((line) => line.includes('R2 not significant'))).toBe(true);
  });

  it('still diagnoses CORONA when R2 is null (C2H4 = 0)', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 100, ch4: 5, c2h6: 5, c2h4: 0, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r2).toBeNull();
    expect(result.diagnosis).toBe('CORONA');
  });
});

describe('ARCING', () => {
  it('diagnoses ARCING when 0.1 < R1 < 1.0, R2 > 0.75, R3 > 0.3, R4 < 0.4', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 5, c2h6: 1, c2h4: 5, c2h2: 5 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBeCloseTo(0.5);
    expect(result.ratios.r2).toBeCloseTo(1.0);
    expect(result.ratios.r3).toBeCloseTo(1.0);
    expect(result.ratios.r4).toBeCloseTo(0.2);
    expect(result.diagnosis).toBe('ARCING');
  });

  it('does not match when a required ratio is null (R1 blocked by zero H2)', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 0, ch4: 5, c2h6: 1, c2h4: 5, c2h2: 5 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBeNull();
    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });
});

describe('INCONCLUSIVE and exact boundaries', () => {
  it('returns INCONCLUSIVE when every ratio equals exactly 1.0 (no strict inequality is satisfied)', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 10, c2h6: 10, c2h4: 10, c2h2: 10 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios).toEqual({ r1: 1, r2: 1, r3: 1, r4: 1 });
    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });

  it('excludes THERMAL_DECOMPOSITION and ARCING at R1 exactly 1.0 (boundary is exclusive)', () => {
    // R2/R3/R4 otherwise satisfy Thermal Decomposition's bounds.
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 10, c2h6: 5, c2h4: 10, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBe(1);
    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });

  it('excludes CORONA and ARCING at R1 exactly 0.1 (boundary is exclusive)', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 100, ch4: 10, c2h6: 5, c2h4: 1, c2h2: 1 };

    const result = runDoernenburgEngine(sample);

    expect(result.ratios.r1).toBeCloseTo(0.1);
    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });

  it('returns INCONCLUSIVE for a sample matching none of the three fault patterns', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 50, ch4: 50, c2h6: 50, c2h4: 50, c2h2: 50 };

    const result = runDoernenburgEngine(sample);

    expect(result.diagnosis).toBe('INCONCLUSIVE');
  });
});

describe('independence from CO/CO2 and determinism', () => {
  it('is unaffected by CO and CO2, which are not Doernenburg inputs', () => {
    const withoutCo: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 20, c2h6: 5, c2h4: 10, c2h2: 1 };
    const withHugeCo: GasSampleInput = { ...withoutCo, co: 99999, co2: 99999 };

    const a = runDoernenburgEngine(withoutCo);
    const b = runDoernenburgEngine(withHugeCo);

    expect(a).toEqual(b);
  });

  it('produces a deterministic result for the same input', () => {
    const sample: GasSampleInput = { ...BASE_SAMPLE, h2: 10, ch4: 5, c2h6: 1, c2h4: 5, c2h2: 5 };

    expect(runDoernenburgEngine(sample)).toEqual(runDoernenburgEngine(sample));
  });
});
