import { describe, expect, it } from 'vitest';
import { classifyDuvalPentagon2Zone, runDuvalPentagon2Engine } from './duvalPentagon2.js';
import { runDuvalPentagon1Engine } from './duvalPentagon1.js';
import type { DuvalPentagon2Zone, GasSampleInput } from './types.js';

const ZERO_SAMPLE: GasSampleInput = {
  h2: 0,
  ch4: 0,
  c2h6: 0,
  c2h4: 0,
  c2h2: 0,
  co: 0,
  co2: 0,
};

// Each zone's own polygon-area centroid (Shoelace formula) — verified via a
// throwaway script to self-classify correctly with no cross-zone overlap
// before writing these tests.
const ZONE_CENTROIDS: Record<DuvalPentagon2Zone, { x: number; y: number }> = {
  PD: { x: -0.5, y: 28.75 },
  D1: { x: 17.0561, y: 16.1621 },
  D2: { x: 15.6051, y: -6.142 },
  S: { x: -14.9015, y: 15.6301 },
  O: { x: -20.0449, y: -9.2293 },
  C: { x: -8.2024, y: -21.3305 },
  'T3-H': { x: 8.2351, y: -21.2599 },
};

// Gas samples independently discovered (grid search) to land in each zone.
const ZONE_SAMPLES: Record<DuvalPentagon2Zone, GasSampleInput> = {
  PD: { ...ZERO_SAMPLE, h2: 72, c2h6: 12, ch4: 4, c2h4: 0, c2h2: 12 },
  D1: { ...ZERO_SAMPLE, h2: 0, c2h6: 0, ch4: 0, c2h4: 4, c2h2: 96 },
  D2: { ...ZERO_SAMPLE, h2: 0, c2h6: 0, ch4: 0, c2h4: 36, c2h2: 64 },
  S: { ...ZERO_SAMPLE, h2: 0, c2h6: 32, ch4: 4, c2h4: 0, c2h2: 64 },
  O: { ...ZERO_SAMPLE, h2: 0, c2h6: 4, ch4: 4, c2h4: 0, c2h2: 92 },
  C: { ...ZERO_SAMPLE, h2: 0, c2h6: 0, ch4: 48, c2h4: 48, c2h2: 4 },
  'T3-H': { ...ZERO_SAMPLE, h2: 0, c2h6: 0, ch4: 0, c2h4: 96, c2h2: 4 },
};

function pentagon2For(sample: GasSampleInput) {
  return runDuvalPentagon2Engine(runDuvalPentagon1Engine(sample));
}

describe('classifyDuvalPentagon2Zone — direct polygon boundary tests', () => {
  for (const [zone, point] of Object.entries(ZONE_CENTROIDS) as Array<
    [DuvalPentagon2Zone, { x: number; y: number }]
  >) {
    it(`classifies zone ${zone}'s own centroid as ${zone}`, () => {
      expect(classifyDuvalPentagon2Zone(point)).toBe(zone);
    });
  }

  it('returns null for a point far outside the pentagon', () => {
    expect(classifyDuvalPentagon2Zone({ x: 1000, y: 1000 })).toBeNull();
  });
});

describe('runDuvalPentagon2Engine — full gas-sample-to-diagnosis flow', () => {
  for (const [zone, sample] of Object.entries(ZONE_SAMPLES) as Array<[DuvalPentagon2Zone, GasSampleInput]>) {
    it(`diagnoses ${zone} for a representative gas sample`, () => {
      const result = pentagon2For(sample);

      expect(result.diagnosis).toBe(zone);
      expect(result.matchedZone).toBe(zone);
      expect(result.coordinates).not.toBeNull();
      expect(result.reasoning.some((line) => line.includes(zone))).toBe(true);
    });
  }

  it('never reports T1, T2, or T3 (Pentagon 1 labels resolved into S/O/C/T3-H)', () => {
    for (const sample of Object.values(ZONE_SAMPLES)) {
      const result = pentagon2For(sample);
      expect(result.diagnosis).not.toBe('T1');
      expect(result.diagnosis).not.toBe('T2');
      expect(result.diagnosis).not.toBe('T3');
    }
  });

  it('surfaces the carbonization caveat when zone C is matched', () => {
    const result = pentagon2For(ZONE_SAMPLES.C);

    expect(result.diagnosis).toBe('C');
    expect(result.reasoning.some((line) => line.includes('possibility of paper carbonization'))).toBe(
      true,
    );
  });

  it('reuses the exact coordinate Pentagon 1 already computed rather than recomputing it', () => {
    const pentagon1 = runDuvalPentagon1Engine(ZONE_SAMPLES.D1);
    const pentagon2 = runDuvalPentagon2Engine(pentagon1);

    expect(pentagon2.coordinates).toEqual(pentagon1.coordinates);
  });
});

describe('matchedZone field', () => {
  it('equals diagnosis when a zone matches', () => {
    const result = pentagon2For(ZONE_SAMPLES.D1);
    expect(result.matchedZone).toBe(result.diagnosis);
  });

  it('is null when diagnosis is null (no Pentagon 1 coordinate)', () => {
    const result = pentagon2For(ZERO_SAMPLE);
    expect(result.diagnosis).toBeNull();
    expect(result.matchedZone).toBeNull();
  });
});

describe('prerequisite — Pentagon 1 must run first', () => {
  it('returns null diagnosis when Pentagon 1 produced no coordinate (all-zero sample)', () => {
    const pentagon1 = runDuvalPentagon1Engine(ZERO_SAMPLE);
    const result = runDuvalPentagon2Engine(pentagon1);

    expect(pentagon1.coordinates).toBeNull();
    expect(result.diagnosis).toBeNull();
    expect(result.coordinates).toBeNull();
    expect(result.reasoning[0]).toMatch(/duval pentagon 1 did not produce a coordinate/i);
  });

  it('returns null diagnosis when Pentagon 1 had a negative gas value', () => {
    const sample: GasSampleInput = { ...ZERO_SAMPLE, h2: 10, ch4: 10, c2h2: -1 };
    const pentagon1 = runDuvalPentagon1Engine(sample);
    const result = runDuvalPentagon2Engine(pentagon1);

    expect(result.diagnosis).toBeNull();
  });

  it('never throws when Pentagon 1 has no coordinate', () => {
    const pentagon1 = runDuvalPentagon1Engine(ZERO_SAMPLE);
    expect(() => runDuvalPentagon2Engine(pentagon1)).not.toThrow();
  });
});

describe('determinism', () => {
  it('produces a deterministic result for the same input', () => {
    const sample = ZONE_SAMPLES.D2;
    expect(pentagon2For(sample)).toEqual(pentagon2For(sample));
  });
});
