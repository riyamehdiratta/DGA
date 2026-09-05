import { describe, expect, it } from 'vitest';
import {
  runDuvalTriangle1,
  runDuvalTriangle4,
  runDuvalTriangle5,
  runDuvalTriangleEngine,
} from './duvalTriangle.js';
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

describe('shared percentage calculation — edge cases', () => {
  it('returns zone null with all-zero relevant gases (sum = 0)', () => {
    const result = runDuvalTriangle1(ZERO_SAMPLE);

    expect(result.zone).toBeNull();
    expect(result.percentages).toBeNull();
    expect(result.reasoning[0]).toMatch(/insufficient data/i);
  });

  it('returns zone null and does not coerce a negative gas value to zero', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 10, c2h4: 10, c2h2: -1 };

    const result = runDuvalTriangle1(sample);

    expect(result.zone).toBeNull();
    expect(result.percentages).toBeNull();
    expect(result.reasoning[0]).toMatch(/negative/i);
  });

  it('never throws for an all-zero sample', () => {
    expect(() => runDuvalTriangle1(ZERO_SAMPLE)).not.toThrow();
    expect(() => runDuvalTriangle4(ZERO_SAMPLE)).not.toThrow();
    expect(() => runDuvalTriangle5(ZERO_SAMPLE)).not.toThrow();
  });

  it('computes percentages that sum to 100 (within floating-point tolerance)', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 30, ch4: 20, c2h6: 10, c2h4: 45, c2h2: 5 };

    const t1 = runDuvalTriangle1(sample).percentages!;
    const t4 = runDuvalTriangle4(sample).percentages!;
    const t5 = runDuvalTriangle5(sample).percentages!;

    expect(t1.ch4 + t1.c2h4 + t1.c2h2).toBeCloseTo(100, 6);
    expect(t4.h2 + t4.ch4 + t4.c2h6).toBeCloseTo(100, 6);
    expect(t5.ch4 + t5.c2h4 + t5.c2h6).toBeCloseTo(100, 6);
  });
});

describe('Triangle 1 — Table 6 zones', () => {
  const cases: Array<[string, GasSampleInput, string]> = [
    ['PD (%CH4 >= 98)', { ...ZERO_SAMPLE, ch4: 990, c2h4: 5, c2h2: 5 }, 'PD'],
    ['T1', { ...ZERO_SAMPLE, ch4: 80, c2h4: 15, c2h2: 2 }, 'T1'],
    ['T2', { ...ZERO_SAMPLE, ch4: 68, c2h4: 30, c2h2: 2 }, 'T2'],
    ['T3', { ...ZERO_SAMPLE, ch4: 25, c2h4: 70, c2h2: 5 }, 'T3'],
    ['DT row 1 (%C2H4<50, %C2H2 in [4,13))', { ...ZERO_SAMPLE, ch4: 62, c2h4: 30, c2h2: 8 }, 'DT'],
    ['DT row 2 (%C2H4 in [40,50), %C2H2 in [13,29))', { ...ZERO_SAMPLE, ch4: 35, c2h4: 45, c2h2: 20 }, 'DT'],
    ['DT row 3 (%C2H4>=50, %C2H2 in [15,29))', { ...ZERO_SAMPLE, ch4: 20, c2h4: 60, c2h2: 20 }, 'DT'],
    ['D1', { ...ZERO_SAMPLE, ch4: 60, c2h4: 10, c2h2: 30 }, 'D1'],
    ['D2 row 1 (%C2H4>=23, %C2H2>=29)', { ...ZERO_SAMPLE, ch4: 25, c2h4: 40, c2h2: 35 }, 'D2'],
    ['D2 row 2 (%C2H4 in [23,40), %C2H2 in [13,29))', { ...ZERO_SAMPLE, ch4: 50, c2h4: 30, c2h2: 20 }, 'D2'],
  ];

  it.each(cases)('%s', (_label, sample, expectedZone) => {
    const result = runDuvalTriangle1(sample);
    expect(result.zone).toBe(expectedZone);
  });

  it('resolves the PD/T1 boundary inclusively at exactly %CH4 = 98', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 98, c2h4: 1, c2h2: 1 };
    expect(runDuvalTriangle1(sample).zone).toBe('PD');
  });

  it('resolves the T1/T2 boundary exclusively at exactly %C2H4 = 20 (T2, not T1)', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 78, c2h4: 20, c2h2: 2 };
    expect(runDuvalTriangle1(sample).zone).toBe('T2');
  });

  it('flags low_gas_levels when the total is below the reliability heuristic', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 2, c2h4: 2, c2h2: 2 };
    expect(runDuvalTriangle1(sample).warnings).toContain('low_gas_levels');
  });

  it('flags near_boundary when a percentage sits within the epsilon of a breakpoint', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 78, c2h4: 20.1, c2h2: 1.9 };
    expect(runDuvalTriangle1(sample).warnings).toContain('near_boundary');
  });

  it('does not flag near_boundary or low_gas_levels for a clean, well-separated point', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 100, c2h4: 100, c2h2: 100 };
    expect(runDuvalTriangle1(sample).warnings).toEqual([]);
  });

  it('never returns UNCLASSIFIED across a fine grid spanning the full percentage simplex', () => {
    for (let pctC2h4 = 0; pctC2h4 <= 100; pctC2h4 += 5) {
      for (let pctC2h2 = 0; pctC2h2 + pctC2h4 <= 100; pctC2h2 += 5) {
        const pctCh4 = 100 - pctC2h4 - pctC2h2;
        const sample: GasSampleInput = {
          ...ZERO_SAMPLE,
          ch4: pctCh4,
          c2h4: pctC2h4,
          c2h2: pctC2h2,
        };
        const result = runDuvalTriangle1(sample);
        expect(result.zone).not.toBeNull();
        expect(result.zone).not.toBe('UNCLASSIFIED');
      }
    }
  });
});

describe('Triangle 4 — Table D.3 zones', () => {
  const cases: Array<[string, GasSampleInput, string]> = [
    ['PD', { ...ZERO_SAMPLE, h2: 89.5, ch4: 10, c2h6: 0.5 }, 'PD'],
    ['S row 1 (%H2>=9, %C2H6 in [30,46))', { ...ZERO_SAMPLE, h2: 20, ch4: 45, c2h6: 35 }, 'S'],
    ['S row 2 (%H2>=15, %C2H6 in [24,30))', { ...ZERO_SAMPLE, h2: 20, ch4: 55, c2h6: 25 }, 'S'],
    ['S row 3 (%CH4<36, %C2H6 in [1,24))', { ...ZERO_SAMPLE, h2: 60, ch4: 30, c2h6: 10 }, 'S'],
    ['S row 4 (%CH4 in [15,36), %C2H6<1)', { ...ZERO_SAMPLE, h2: 79.5, ch4: 20, c2h6: 0.5 }, 'S'],
    ['S row 5 (%CH4<2, %C2H6<1)', { ...ZERO_SAMPLE, h2: 98.5, ch4: 1, c2h6: 0.5 }, 'S'],
    ['O (%H2<9, %C2H6>=30)', { ...ZERO_SAMPLE, h2: 5, ch4: 45, c2h6: 50 }, 'O'],
    ['C (%CH4>=36, %C2H6>=24)', { ...ZERO_SAMPLE, h2: 5, ch4: 70, c2h6: 25 }, 'C'],
    ['ND (%H2>=9, %C2H6>=46)', { ...ZERO_SAMPLE, h2: 20, ch4: 30, c2h6: 50 }, 'ND'],
  ];

  it.each(cases)('%s', (_label, sample, expectedZone) => {
    const result = runDuvalTriangle4(sample);
    expect(result.zone).toBe(expectedZone);
  });

  it('surfaces the carbonization caveat when zone C is matched', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 5, ch4: 70, c2h6: 25 };
    const result = runDuvalTriangle4(sample);

    expect(result.zone).toBe('C');
    expect(result.reasoning.some((line) => line.includes('possibility of paper carbonization'))).toBe(
      true,
    );
  });
});

describe('Triangle 5 — Table D.4 zones', () => {
  const cases: Array<[string, GasSampleInput, string]> = [
    ['PD', { ...ZERO_SAMPLE, ch4: 87, c2h4: 0.5, c2h6: 12.5 }, 'PD'],
    ['O row 1 (%C2H4 in [1,10), %C2H6 in [2,14))', { ...ZERO_SAMPLE, ch4: 87, c2h4: 5, c2h6: 8 }, 'O'],
    ['O row 2 (%C2H4<1, %C2H6<2)', { ...ZERO_SAMPLE, ch4: 98.5, c2h4: 0.5, c2h6: 1 }, 'O'],
    ['O row 3 (%C2H4<10, %C2H6>=54)', { ...ZERO_SAMPLE, ch4: 35, c2h4: 5, c2h6: 60 }, 'O'],
    ['S (%C2H4<10, %C2H6 in [14,54))', { ...ZERO_SAMPLE, ch4: 87, c2h4: 5, c2h6: 8 + 12 }, 'S'],
    ['T2', { ...ZERO_SAMPLE, ch4: 75, c2h4: 20, c2h6: 5 }, 'T2'],
    ['T3 row 1 (%C2H4>=35, %C2H6<12)', { ...ZERO_SAMPLE, ch4: 55, c2h4: 40, c2h6: 5 }, 'T3'],
    ['T3 row 2 (%C2H4>=50, %C2H6 in [12,14))', { ...ZERO_SAMPLE, ch4: 32, c2h4: 55, c2h6: 13 }, 'T3'],
    ['T3 row 3 (%C2H4>=70, %C2H6>=14)', { ...ZERO_SAMPLE, ch4: 5, c2h4: 75, c2h6: 20 }, 'T3'],
    ['T3 row 4 (%C2H4>=35, %C2H6>=30)', { ...ZERO_SAMPLE, ch4: 25, c2h4: 40, c2h6: 35 }, 'T3'],
    ['C row 1 (%C2H4 in [10,50), %C2H6 in [12,14))', { ...ZERO_SAMPLE, ch4: 57, c2h4: 30, c2h6: 13 }, 'C'],
    ['C row 2 (%C2H4 in [10,70), %C2H6 in [14,30))', { ...ZERO_SAMPLE, ch4: 50, c2h4: 30, c2h6: 20 }, 'C'],
    ['ND (%C2H4 in [10,35), %C2H6>=30)', { ...ZERO_SAMPLE, ch4: 45, c2h4: 20, c2h6: 35 }, 'ND'],
  ];

  it.each(cases)('%s', (_label, sample, expectedZone) => {
    const result = runDuvalTriangle5(sample);
    expect(result.zone).toBe(expectedZone);
  });

  it('surfaces the carbonization caveat when zone C is matched', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 57, c2h4: 30, c2h6: 13 };
    const result = runDuvalTriangle5(sample);

    expect(result.zone).toBe('C');
    expect(result.reasoning.some((line) => line.includes('possibility of paper carbonization'))).toBe(
      true,
    );
  });
});

describe('routing rules — orchestrator', () => {
  it('always runs Triangle 1', () => {
    const result = runDuvalTriangleEngine(ZERO_SAMPLE);
    expect(result.triangle1).toBeDefined();
  });

  it('runs Triangle 4 only when Triangle 1 result is PD, T1, or T2', () => {
    const pdSample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 990, c2h4: 5, c2h2: 5 };
    const t1Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 80, c2h4: 15, c2h2: 2 };
    const t2Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 68, c2h4: 30, c2h2: 2 };

    for (const sample of [pdSample, t1Sample, t2Sample]) {
      const result = runDuvalTriangleEngine(sample);
      expect(result.triangle4).not.toBeNull();
    }
  });

  it('runs Triangle 5 only when Triangle 1 result is T2 or T3', () => {
    const t2Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 68, c2h4: 30, c2h2: 2 };
    const t3Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 25, c2h4: 70, c2h2: 5 };

    for (const sample of [t2Sample, t3Sample]) {
      const result = runDuvalTriangleEngine(sample);
      expect(result.triangle5).not.toBeNull();
    }
  });

  it('runs BOTH Triangle 4 and Triangle 5 when Triangle 1 result is T2 (not mutually exclusive)', () => {
    const t2Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 68, c2h4: 30, c2h2: 2 };

    const result = runDuvalTriangleEngine(t2Sample);

    expect(result.triangle1.zone).toBe('T2');
    expect(result.triangle4).not.toBeNull();
    expect(result.triangle5).not.toBeNull();
  });

  it('runs neither Triangle 4 nor Triangle 5 for DT, D1, or D2 results', () => {
    const dtSample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 62, c2h4: 30, c2h2: 8 };
    const d1Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 60, c2h4: 10, c2h2: 30 };
    const d2Sample: GasSampleInput = { ...ZERO_SAMPLE, ch4: 25, c2h4: 40, c2h2: 35 };

    for (const sample of [dtSample, d1Sample, d2Sample]) {
      const result = runDuvalTriangleEngine(sample);
      expect(['DT', 'D1', 'D2']).toContain(result.triangle1.zone);
      expect(result.triangle4).toBeNull();
      expect(result.triangle5).toBeNull();
    }
  });

  it('runs neither refinement when Triangle 1 itself has insufficient data', () => {
    const result = runDuvalTriangleEngine(ZERO_SAMPLE);

    expect(result.triangle1.zone).toBeNull();
    expect(result.triangle4).toBeNull();
    expect(result.triangle5).toBeNull();
  });

  it('produces a deterministic result for the same input', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 20, ch4: 68, c2h6: 5, c2h4: 30, c2h2: 2 };
    expect(runDuvalTriangleEngine(sample)).toEqual(runDuvalTriangleEngine(sample));
  });
});
