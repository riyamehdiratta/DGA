import { isPointInPolygon } from './duvalPentagonCoordinates.js';
import type {
  DuvalPentagon1Result,
  DuvalPentagon2Result,
  DuvalPentagon2Zone,
  DuvalPentagonCoordinate,
} from './types.js';

/**
 * Zone boundary coordinates, transcribed exactly from DUVAL_PENTAGON_2_RULES.md.
 * PD/D1/D2/S are numerically identical to Pentagon 1 (both docs independently
 * specify the same values) — transcribed separately here rather than imported
 * from duvalPentagon1.ts, since each doc is its own source of truth and the
 * two engines' zone sets are otherwise unrelated (Pentagon 1 has T1/T2/T3
 * where Pentagon 2 has O/C/T3-H instead).
 */
const ZONE_POLYGONS: Record<DuvalPentagon2Zone, DuvalPentagonCoordinate[]> = {
  PD: [
    { x: 0, y: 33 },
    { x: -1, y: 33 },
    { x: -1, y: 24.5 },
    { x: 0, y: 24.5 },
  ],
  D1: [
    { x: 0, y: 40 },
    { x: 38, y: 12 },
    { x: 32, y: -6.1 },
    { x: 4, y: 16 },
    { x: 0, y: 1.5 },
  ],
  D2: [
    { x: 4, y: 16 },
    { x: 32, y: -6.1 },
    { x: 24.3, y: -30 },
    { x: 0, y: -3 },
    { x: 0, y: 1.5 },
  ],
  S: [
    { x: 0, y: 1.5 },
    { x: -35, y: 3.1 },
    { x: -38, y: 12.4 },
    { x: 0, y: 40 },
    { x: 0, y: 33 },
    { x: -1, y: 33 },
    { x: -1, y: 24.5 },
    { x: 0, y: 24.5 },
  ],
  O: [
    { x: -3.5, y: -3 },
    { x: -11, y: -8 },
    { x: -21.5, y: -32.4 },
    { x: -23.5, y: -32.4 },
    { x: -35, y: 3.1 },
    { x: 0, y: 1.5 },
    { x: 0, y: -3 },
  ],
  C: [
    { x: -3.5, y: -3 },
    { x: 2.5, y: -32.4 },
    { x: -21.5, y: -32.4 },
    { x: -11, y: -8 },
  ],
  'T3-H': [
    { x: 0, y: -3 },
    { x: 24.3, y: -30 },
    { x: 23.5, y: -32.4 },
    { x: 2.5, y: -32.4 },
    { x: -3.5, y: -3 },
  ],
};

/** Evaluation order per the doc's §4 "Fault Zones" listing. Zones do not overlap, so order is not load-bearing. */
const ZONE_ORDER: DuvalPentagon2Zone[] = ['PD', 'D1', 'D2', 'S', 'O', 'C', 'T3-H'];

/** Exported for direct, coordinate-level unit testing of the zone classifier in isolation. */
export function classifyDuvalPentagon2Zone(point: DuvalPentagonCoordinate): DuvalPentagon2Zone | null {
  for (const zone of ZONE_ORDER) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) {
      return zone;
    }
  }
  return null;
}

/**
 * IEEE Duval Pentagon 2 method (DUVAL_PENTAGON_2_RULES.md).
 *
 * "The coordinate calculation is identical to Duval Pentagon 1. Only the
 * fault zones differ" — so this reuses Pentagon 1's already-computed
 * coordinate directly rather than recomputing it, and classifies that same
 * point against Pentagon 2's own seven-zone polygon set. Never reports
 * T1/T2/T3 — those Pentagon 1 labels are resolved into S/O/C/T3-H here.
 *
 * Requires Pentagon 1 to have run first (§9/§11): if Pentagon 1 produced no
 * coordinate (insufficient/invalid input), Pentagon 2 cannot run either.
 */
export function runDuvalPentagon2Engine(pentagon1: DuvalPentagon1Result): DuvalPentagon2Result {
  if (pentagon1.coordinates == null) {
    return {
      diagnosis: null,
      coordinates: null,
      matchedZone: null,
      reasoning: [
        'Duval Pentagon 1 did not produce a coordinate (insufficient or invalid input data), so Pentagon 2 refinement cannot run.',
      ],
    };
  }

  const coordinates = pentagon1.coordinates;
  const zone = classifyDuvalPentagon2Zone(coordinates);

  const reasoning: string[] = [
    `Pentagon centroid = (${coordinates.x.toFixed(3)}, ${coordinates.y.toFixed(3)}) (reused from Duval Pentagon 1).`,
  ];
  if (zone == null) {
    reasoning.push('The centroid does not lie inside any defined Duval Pentagon 2 fault zone.');
  } else {
    reasoning.push(`Centroid lies inside fault zone ${zone}.`);
    if (zone === 'C') {
      reasoning.push(
        'Zone C indicates a possibility of paper carbonization, not certainty — further investigation with carbon oxides and furans analysis is recommended.',
      );
    }
  }

  return {
    diagnosis: zone ?? 'OUTSIDE',
    coordinates,
    matchedZone: zone,
    reasoning,
  };
}
