import { describe, expect, it } from 'vitest';
import { runKeyGasEngine } from './keyGas.js';
import type { GasSampleInput } from './types.js';

const ZERO_SAMPLE: GasSampleInput = {
  h2: 0,
  ch4: 0,
  c2h6: 0,
  c2h4: 0,
  c2h2: 0,
  co: 0,
  co2: 0,
};

describe('INCONCLUSIVE cases', () => {
  it('returns INCONCLUSIVE when all key gas candidates are zero', () => {
    const result = runKeyGasEngine(ZERO_SAMPLE);

    expect(result).toEqual({
      diagnosis: 'INCONCLUSIVE',
      dominantGas: null,
      confidence: 'LOW',
      reasoning: expect.any(Array),
    });
    expect(result.reasoning[0]).toMatch(/no dominant gas can be determined/i);
  });

  it('returns INCONCLUSIVE when two key gas candidates tie for the maximum', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 50, c2h4: 50 };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('INCONCLUSIVE');
    expect(result.dominantGas).toBeNull();
    expect(result.confidence).toBe('LOW');
    expect(result.reasoning[0]).toMatch(/tied for the highest concentration/i);
    expect(result.reasoning[0]).toContain('H2');
    expect(result.reasoning[0]).toContain('C2H4');
  });

  it('returns INCONCLUSIVE when three key gas candidates tie for the maximum', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, co: 10, c2h2: 10, c2h4: 10 };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('INCONCLUSIVE');
    expect(result.dominantGas).toBeNull();
  });

  it('is unaffected by large CH4/C2H6/CO2 values, which are never key gas candidates', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      ch4: 100000,
      c2h6: 100000,
      co2: 100000,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('INCONCLUSIVE');
    expect(result.dominantGas).toBeNull();
  });
});

describe('THERMAL_OIL — C2H4 dominant', () => {
  it('diagnoses THERMAL_OIL with HIGH confidence when C2H4 clearly dominates', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      c2h4: 100,
      h2: 5,
      co: 5,
      c2h2: 0,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('THERMAL_OIL');
    expect(result.dominantGas).toBe('c2h4');
    expect(result.confidence).toBe('HIGH');
    expect(result.reasoning[0]).toContain('C2H4');
  });

  it('diagnoses THERMAL_OIL with MEDIUM confidence when C2H4 leads but does not dominate the total', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      c2h4: 40,
      h2: 30,
      co: 20,
      c2h2: 0,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('THERMAL_OIL');
    expect(result.confidence).toBe('MEDIUM');
  });

  it('is unaffected by trace C2H2, matching the documented "trace C2H2 at very high temperatures" pattern', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      c2h4: 100,
      h2: 5,
      co: 5,
      c2h2: 1,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('THERMAL_OIL');
  });
});

describe('THERMAL_CELLULOSE — CO dominant', () => {
  it('diagnoses THERMAL_CELLULOSE with HIGH confidence when CO clearly dominates', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      co: 500,
      h2: 10,
      c2h4: 10,
      c2h2: 0,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('THERMAL_CELLULOSE');
    expect(result.dominantGas).toBe('co');
    expect(result.confidence).toBe('HIGH');
  });

  it('diagnoses THERMAL_CELLULOSE with MEDIUM confidence at a narrower margin', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      co: 40,
      h2: 30,
      c2h4: 20,
      c2h2: 0,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('THERMAL_CELLULOSE');
    expect(result.confidence).toBe('MEDIUM');
  });
});

describe('ARCING — C2H2 dominant', () => {
  it('diagnoses ARCING with HIGH confidence when C2H2 clearly dominates', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      c2h2: 200,
      h2: 20,
      ch4: 10,
      c2h4: 10,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('ARCING');
    expect(result.dominantGas).toBe('c2h2');
    expect(result.confidence).toBe('HIGH');
  });
});

describe('PARTIAL_DISCHARGE vs ARCING — H2 dominant', () => {
  it('diagnoses PARTIAL_DISCHARGE when H2 dominates and no C2H2 is present', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 100,
      ch4: 10,
      c2h4: 2,
      c2h6: 2,
      c2h2: 0,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('PARTIAL_DISCHARGE');
    expect(result.dominantGas).toBe('h2');
    expect(result.confidence).toBe('HIGH');
  });

  it('diagnoses ARCING (not PARTIAL_DISCHARGE) when H2 dominates but C2H2 is also present', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 100,
      ch4: 10,
      c2h4: 2,
      c2h2: 1,
      co: 5,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('ARCING');
    expect(result.dominantGas).toBe('h2');
    expect(result.confidence).toBe('LOW');
    expect(result.reasoning[0]).toContain('C2H2');
  });

  it('flags even a very small trace of C2H2 as tipping H2-dominant toward ARCING', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 500,
      c2h2: 0.1,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('ARCING');
    expect(result.confidence).toBe('LOW');
  });

  it('diagnoses PARTIAL_DISCHARGE with MEDIUM confidence at a narrower H2 margin', () => {
    const sample: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 40,
      c2h4: 30,
      co: 20,
      c2h2: 0,
    };

    const result = runKeyGasEngine(sample);

    expect(result.diagnosis).toBe('PARTIAL_DISCHARGE');
    expect(result.confidence).toBe('MEDIUM');
  });
});

describe('independence from other engines and gas ratios', () => {
  it('never uses CH4, C2H6, or CO2 to determine the diagnosis', () => {
    const withoutSecondaries: GasSampleInput = { ...ZERO_SAMPLE, c2h4: 50 };
    const withHugeSecondaries: GasSampleInput = {
      ...ZERO_SAMPLE,
      c2h4: 50,
      ch4: 99999,
      c2h6: 99999,
      co2: 99999,
    };

    const a = runKeyGasEngine(withoutSecondaries);
    const b = runKeyGasEngine(withHugeSecondaries);

    expect(a.diagnosis).toBe(b.diagnosis);
    expect(a.dominantGas).toBe(b.dominantGas);
  });

  it('produces a deterministic result for the same input', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 80, c2h2: 5 };

    const first = runKeyGasEngine(sample);
    const second = runKeyGasEngine(sample);

    expect(first).toEqual(second);
  });
});
