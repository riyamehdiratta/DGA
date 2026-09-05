import { describe, expect, it } from 'vitest';
import { computeDuvalPentagonCoordinate } from './duvalPentagonCoordinates.js';
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

describe('edge cases (DUVAL_PENTAGON_1_RULES.md coordinate algorithm)', () => {
  it('returns null when total hydrocarbon gas is zero', () => {
    expect(computeDuvalPentagonCoordinate(ZERO_SAMPLE)).toBeNull();
  });

  it('returns null and does not coerce a negative gas value to zero', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 10, ch4: 10, c2h2: -1 };
    expect(computeDuvalPentagonCoordinate(sample)).toBeNull();
  });

  it('returns null for a degenerate zero-area polygon (single gas at 100%)', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 100 };
    expect(computeDuvalPentagonCoordinate(sample)).toBeNull();
  });

  it('never throws for an all-zero sample', () => {
    expect(() => computeDuvalPentagonCoordinate(ZERO_SAMPLE)).not.toThrow();
  });
});

describe('correctness via geometric symmetry', () => {
  it('returns the origin when all five gases are equal (regular pentagon, centroid at (0,0))', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 20, ch4: 20, c2h6: 20, c2h4: 20, c2h2: 20 };

    const coordinate = computeDuvalPentagonCoordinate(sample)!;

    expect(coordinate.x).toBeCloseTo(0, 9);
    expect(coordinate.y).toBeCloseTo(0, 9);
  });

  it('returns x = 0 when C2H2/C2H6 and CH4/C2H4 are pairwise equal (mirror symmetry across the H2 axis)', () => {
    // Axis angles: C2H2=18°, C2H6=162° are mirror images across the y-axis (H2's
    // own axis, 90°); CH4=234°, C2H4=306° are likewise mirror images. Equal
    // pairs force the centroid onto the y-axis regardless of the H2 share.
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 60, ch4: 10, c2h6: 10, c2h4: 10, c2h2: 10 };

    const coordinate = computeDuvalPentagonCoordinate(sample)!;

    expect(coordinate.x).toBeCloseTo(0, 9);
  });

  it('places the centroid on the positive y-axis when H2 dominates (pulled toward the H2 vertex at 90°)', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 90, ch4: 2.5, c2h6: 2.5, c2h4: 2.5, c2h2: 2.5 };

    const coordinate = computeDuvalPentagonCoordinate(sample)!;

    expect(coordinate.x).toBeCloseTo(0, 9);
    expect(coordinate.y).toBeGreaterThan(0);
  });
});

describe('determinism and scale invariance', () => {
  it('produces a deterministic result for the same input', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 30, ch4: 20, c2h6: 10, c2h4: 25, c2h2: 15 };

    expect(computeDuvalPentagonCoordinate(sample)).toEqual(computeDuvalPentagonCoordinate(sample));
  });

  it('is invariant to scaling all gas concentrations by the same factor (percentages are ratio-based)', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 30, ch4: 20, c2h6: 10, c2h4: 25, c2h2: 15 };
    const scaled: GasSampleInput = {
      ...ZERO_SAMPLE,
      h2: 300,
      ch4: 200,
      c2h6: 100,
      c2h4: 250,
      c2h2: 150,
    };

    const a = computeDuvalPentagonCoordinate(sample)!;
    const b = computeDuvalPentagonCoordinate(scaled)!;

    expect(b.x).toBeCloseTo(a.x, 9);
    expect(b.y).toBeCloseTo(a.y, 9);
  });
});
