import { describe, expect, it } from 'vitest';
import { classifyDuvalPentagon1Zone, runDuvalPentagon1Engine } from './duvalPentagon1.js';
import type { DuvalPentagon1Zone, GasSampleInput } from './types.js';

const ZERO_SAMPLE: GasSampleInput = {
  h2: 0,
  ch4: 0,
  c2h6: 0,
  c2h4: 0,
  c2h2: 0,
  co: 0,
  co2: 0,
};

// Each zone's own polygon-area centroid (Shoelace formula, same math as the
// coordinate engine) — guaranteed to lie inside that polygon for a simple,
// non-self-intersecting shape. Independently verified (against every other
// zone too, confirming no overlap) before writing these tests.
const ZONE_CENTROIDS: Record<DuvalPentagon1Zone, { x: number; y: number }> = {
  PD: { x: -0.5, y: 28.75 },
  D1: { x: 17.0561, y: 16.1621 },
  D2: { x: 15.6051, y: -6.142 },
  T1: { x: -19.6519, y: -9.3104 },
  T2: { x: -9.1667, y: -22.9333 },
  T3: { x: 6.9538, y: -20.5814 },
  S: { x: -14.9015, y: 15.6301 },
};

// Gas samples independently discovered (grid search) to land in each zone,
// used for full gas-input-to-diagnosis integration coverage.
const ZONE_SAMPLES: Record<DuvalPentagon1Zone, GasSampleInput> = {
  PD: { ...ZERO_SAMPLE, h2: 72, c2h6: 12, ch4: 4, c2h4: 0, c2h2: 12 },
  D1: { ...ZERO_SAMPLE, h2: 1, c2h6: 1, ch4: 1, c2h4: 1, c2h2: 96 },
  D2: { ...ZERO_SAMPLE, h2: 0, c2h6: 0, ch4: 0, c2h4: 36, c2h2: 64 },
  T1: { ...ZERO_SAMPLE, h2: 1, c2h6: 1, ch4: 96, c2h4: 1, c2h2: 1 },
  T2: { ...ZERO_SAMPLE, h2: 0, c2h6: 0, ch4: 52, c2h4: 48, c2h2: 0 },
  T3: { ...ZERO_SAMPLE, h2: 1, c2h6: 1, ch4: 1, c2h4: 96, c2h2: 1 },
  S: { ...ZERO_SAMPLE, h2: 1, c2h6: 96, ch4: 1, c2h4: 1, c2h2: 1 },
};

describe('classifyDuvalPentagon1Zone — direct polygon boundary tests', () => {
  for (const [zone, point] of Object.entries(ZONE_CENTROIDS) as Array<
    [DuvalPentagon1Zone, { x: number; y: number }]
  >) {
    it(`classifies zone ${zone}'s own centroid as ${zone}`, () => {
      expect(classifyDuvalPentagon1Zone(point)).toBe(zone);
    });
  }

  it('returns null (OUTSIDE, once wrapped by the engine) for a point far outside the pentagon', () => {
    expect(classifyDuvalPentagon1Zone({ x: 1000, y: 1000 })).toBeNull();
  });
});

describe('runDuvalPentagon1Engine — full gas-sample-to-diagnosis flow', () => {
  for (const [zone, sample] of Object.entries(ZONE_SAMPLES) as Array<[DuvalPentagon1Zone, GasSampleInput]>) {
    it(`diagnoses ${zone} for a representative gas sample`, () => {
      const result = runDuvalPentagon1Engine(sample);

      expect(result.diagnosis).toBe(zone);
      expect(result.coordinates).not.toBeNull();
      expect(result.reasoning.some((line) => line.includes(zone))).toBe(true);
    });
  }
});

describe('edge cases', () => {
  it('returns diagnosis null (insufficient data) for an all-zero sample', () => {
    const result = runDuvalPentagon1Engine(ZERO_SAMPLE);

    expect(result.diagnosis).toBeNull();
    expect(result.coordinates).toBeNull();
    expect(result.reasoning[0]).toMatch(/no duval pentagon coordinate/i);
  });

  it('returns diagnosis null and does not coerce a negative gas value to zero', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 10, ch4: 10, c2h2: -1 };

    const result = runDuvalPentagon1Engine(sample);

    expect(result.diagnosis).toBeNull();
    expect(result.coordinates).toBeNull();
  });

  it('never throws for an all-zero sample', () => {
    expect(() => runDuvalPentagon1Engine(ZERO_SAMPLE)).not.toThrow();
  });

  it('produces a deterministic result for the same input', () => {
    const sample = ZONE_SAMPLES.D1;
    expect(runDuvalPentagon1Engine(sample)).toEqual(runDuvalPentagon1Engine(sample));
  });
});

describe('IEEE coordinate accuracy regression (audit findings C1/C2)', () => {
  it('T2 zone boundary uses y=-32.4 (not -32) for its second vertex, per the standard', () => {
    // Just above the corrected boundary (-32.4 < y < -32): inside T2 only
    // under the corrected polygon, not under the old (wrong) -32 vertex.
    expect(classifyDuvalPentagon1Zone({ x: 0.9, y: -32.2 })).toBe('T2');
  });

  it("S zone uses the standard's 3.1/12.4 vertices, matching Pentagon 2's S exactly", () => {
    // Pentagon 1 and Pentagon 2 independently document the same S geometry in
    // the standard (confirmed by cross-referencing both docs against the PDF).
    // (-38, 12) was the old, incorrect vertex — since the corrected boundary
    // moved to (-38, 12.4), this exact point must no longer classify as S.
    expect(classifyDuvalPentagon1Zone({ x: -38, y: 12 })).not.toBe('S');
  });
});
