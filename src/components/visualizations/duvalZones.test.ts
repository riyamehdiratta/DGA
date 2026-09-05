import { describe, expect, it } from 'vitest';
import { pentagonToSvg, ternaryToSvg, TRI_VERTICES } from './duvalGeometry';
import type { SvgPoint } from './duvalGeometry';
import {
  PENTAGON1_ZONES,
  PENTAGON2_ZONES,
  TRIANGLE1_SPEC,
  TRIANGLE4_SPEC,
  TRIANGLE5_SPEC,
} from './duvalZones';
import type { PentagonZone, TernaryTriple, TriangleSpec } from './duvalZones';

/**
 * The triangle zone polygons in duvalZones.ts are hand-derived from the IEEE
 * C57.104-2019 boundary tables (docs/DUVAL_TRIANGLE_RULES.md) that the backend
 * rule engine implements. These tests prove the drawing matches the rules: a
 * dense sweep of the ternary domain must land in the same zone under
 * point-in-polygon containment as under the table conditions (transcribed
 * below exactly as in backend/src/lib/analysis/duvalTriangle.ts).
 *
 * Sample points sit at 0.25/0.75 offsets so they are never on a boundary
 * (every table threshold is an integer).
 */

function pointInPolygon(p: SvgPoint, polygon: SvgPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function triangleZonesContaining(spec: TriangleSpec, triple: TernaryTriple): string[] {
  const vertices = spec.gasOrder.map((gas) => TRI_VERTICES[spec.vertexOf[gas]]) as [
    SvgPoint,
    SvgPoint,
    SvgPoint,
  ];
  const point = ternaryToSvg(triple, vertices);
  const codes: string[] = [];
  for (const zone of spec.zones) {
    if (zone.polygons.some((polygon) => pointInPolygon(point, polygon.map((t) => ternaryToSvg(t, vertices))))) {
      codes.push(zone.code);
    }
  }
  return codes;
}

// --- Table rules, transcribed verbatim from the backend engine -------------

function matchTriangle1(ch4: number, c2h4: number, c2h2: number): string | null {
  if (ch4 >= 98) return 'PD';
  if (ch4 < 98 && c2h4 < 20 && c2h2 < 4) return 'T1';
  if (c2h4 >= 20 && c2h4 < 50 && c2h2 < 4) return 'T2';
  if (c2h4 >= 50 && c2h2 < 15) return 'T3';
  if (c2h4 < 50 && c2h2 >= 4 && c2h2 < 13) return 'DT';
  if (c2h4 >= 40 && c2h4 < 50 && c2h2 >= 13 && c2h2 < 29) return 'DT';
  if (c2h4 >= 50 && c2h2 >= 15 && c2h2 < 29) return 'DT';
  if (c2h4 < 23 && c2h2 >= 13) return 'D1';
  if (c2h4 >= 23 && c2h2 >= 29) return 'D2';
  if (c2h4 >= 23 && c2h4 < 40 && c2h2 >= 13 && c2h2 < 29) return 'D2';
  return null;
}

function matchTriangle4(h2: number, ch4: number, c2h6: number): string | null {
  if (ch4 >= 2 && ch4 < 15 && c2h6 < 1) return 'PD';
  if (h2 >= 9 && c2h6 >= 30 && c2h6 < 46) return 'S';
  if (h2 >= 15 && c2h6 >= 24 && c2h6 < 30) return 'S';
  if (ch4 < 36 && c2h6 >= 1 && c2h6 < 24) return 'S';
  if (ch4 < 36 && ch4 >= 15 && c2h6 < 1) return 'S';
  if (ch4 < 2 && c2h6 < 1) return 'S';
  if (h2 < 9 && c2h6 >= 30) return 'O';
  if (ch4 >= 36 && c2h6 >= 24) return 'C';
  if (h2 < 15 && c2h6 >= 24 && c2h6 < 30) return 'C';
  if (h2 >= 9 && c2h6 >= 46) return 'ND';
  return null;
}

function matchTriangle5(c2h4: number, c2h6: number): string | null {
  if (c2h4 < 1 && c2h6 >= 2 && c2h6 < 14) return 'PD';
  if (c2h4 >= 1 && c2h4 < 10 && c2h6 >= 2 && c2h6 < 14) return 'O';
  if (c2h4 < 1 && c2h6 < 2) return 'O';
  if (c2h4 < 10 && c2h6 >= 54) return 'O';
  if (c2h4 < 10 && c2h6 >= 14 && c2h6 < 54) return 'S';
  if (c2h4 >= 10 && c2h4 < 35 && c2h6 < 12) return 'T2';
  if (c2h4 >= 35 && c2h6 < 12) return 'T3';
  if (c2h4 >= 50 && c2h6 >= 12 && c2h6 < 14) return 'T3';
  if (c2h4 >= 70 && c2h6 >= 14) return 'T3';
  if (c2h4 >= 35 && c2h6 >= 30) return 'T3';
  if (c2h4 >= 10 && c2h4 < 50 && c2h6 >= 12 && c2h6 < 14) return 'C';
  if (c2h4 >= 10 && c2h4 < 70 && c2h6 >= 14 && c2h6 < 30) return 'C';
  if (c2h4 >= 10 && c2h4 < 35 && c2h6 >= 30) return 'ND';
  return null;
}

function sweepTriangle(
  spec: TriangleSpec,
  ruleZone: (triple: TernaryTriple) => string | null,
  /**
   * (expected, actual) pairs that are an intentional, documented divergence
   * between the raw table's first-match-wins classification and the drawn
   * polygons — e.g. Triangle 4's C zone visually fills areas Table D.3
   * leaves technically uncovered, matching the official Figure D.3. The
   * backend classifier is unaffected; this only accepts the frontend
   * drawing's deliberate choice.
   */
  acceptedDivergence?: (expected: string | null, actual: string | null) => boolean,
): void {
  const mismatches: string[] = [];
  const overlaps: string[] = [];
  for (let a = 0.25; a < 100; a += 0.5) {
    for (let b = 0.25; a + b < 100; b += 0.5) {
      const c = 100 - a - b;
      // Every table threshold is an integer, so points whose derived third
      // coordinate is (near-)integer sit on a zone boundary — resolved by
      // inequality direction in the rules but ambiguous for containment.
      if (Math.abs(c - Math.round(c)) < 0.2) continue;
      const triple: TernaryTriple = [a, b, c];
      const expected = ruleZone(triple);
      const actual = triangleZonesContaining(spec, triple);
      if (actual.length > 1) {
        overlaps.push(`(${a}, ${b}, ${c.toFixed(2)}) in ${actual.join('+')}`);
      }
      const got = actual[0] ?? null;
      if (got !== expected && !acceptedDivergence?.(expected, got)) {
        mismatches.push(`(${a}, ${b}, ${c.toFixed(2)}) rules=${expected} polygon=${got}`);
      }
      if (mismatches.length > 5 || overlaps.length > 5) break;
    }
  }
  expect(overlaps, `overlapping zone polygons: ${overlaps.join('; ')}`).toEqual([]);
  expect(mismatches, `polygon/table divergence: ${mismatches.join('; ')}`).toEqual([]);
}

describe('Duval triangle zone polygons match the IEEE boundary tables', () => {
  it('Triangle 1 (Table 6)', () => {
    sweepTriangle(TRIANGLE1_SPEC, ([ch4, c2h4, c2h2]) => matchTriangle1(ch4, c2h4, c2h2));
  });

  it('Triangle 4 (Table D.3)', () => {
    sweepTriangle(
      TRIANGLE4_SPEC,
      ([h2, ch4, c2h6]) => matchTriangle4(h2, ch4, c2h6),
      (expected, actual) =>
        // Table-uncovered area drawn as C, matching Figure D.3's solid fill.
        (expected === null && actual === 'C') ||
        // Tiny C1/ND check-order overlap corner drawn as ND, matching Figure
        // D.3's clean un-notched ND triangle (see duvalZones.ts comment).
        (expected === 'C' && actual === 'ND'),
    );
  });

  it('Triangle 5 (Table D.4)', () => {
    sweepTriangle(TRIANGLE5_SPEC, ([, c2h4, c2h6]) => matchTriangle5(c2h4, c2h6));
  });
});

describe('zone label anchors sit inside their own zone', () => {
  it.each([
    ['Triangle 1', TRIANGLE1_SPEC],
    ['Triangle 4', TRIANGLE4_SPEC],
    ['Triangle 5', TRIANGLE5_SPEC],
  ] as const)('%s', (_name, spec) => {
    for (const zone of spec.zones) {
      for (const label of zone.labels) {
        // External labels (offset with a leader line) point at leaderTo instead.
        const anchor = label.leaderTo ?? label.at;
        const containing = triangleZonesContaining(spec, anchor);
        expect(containing, `${zone.code} label at (${anchor.join(', ')})`).toEqual([zone.code]);
      }
    }
  });

  it.each([
    ['Pentagon 1', PENTAGON1_ZONES],
    ['Pentagon 2', PENTAGON2_ZONES],
  ] as const)('%s', (_name, zones: PentagonZone[]) => {
    for (const zone of zones) {
      for (const label of zone.labels) {
        // External labels (with a leader line) live outside every zone instead.
        const point = pentagonToSvg(label.leaderTo ?? label.at);
        const containing = zones
          .filter((z) => pointInPolygon(point, z.polygon.map(pentagonToSvg)))
          .map((z) => z.code);
        expect(containing, `${zone.code} label`).toEqual([zone.code]);
      }
    }
  });
});
