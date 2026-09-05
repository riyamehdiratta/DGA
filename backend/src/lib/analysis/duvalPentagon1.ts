import { computeDuvalPentagonCoordinate, isPointInPolygon } from './duvalPentagonCoordinates.js';
import type {
  DuvalPentagon1Result,
  DuvalPentagon1Zone,
  DuvalPentagonCoordinate,
  GasSampleInput,
} from './types.js';

/** Zone boundary coordinates, transcribed exactly from DUVAL_PENTAGON_1_RULES.md. */
const ZONE_POLYGONS: Record<DuvalPentagon1Zone, DuvalPentagonCoordinate[]> = {
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
  T1: [
    { x: -6, y: -4 },
    { x: -22.5, y: -32.4 },
    { x: -23.5, y: -32.4 },
    { x: -35, y: 3 },
    { x: 0, y: 1.5 },
    { x: 0, y: -3 },
  ],
  T2: [
    { x: -6, y: -4 },
    { x: 1, y: -32.4 },
    { x: -22.5, y: -32.4 },
  ],
  T3: [
    { x: 0, y: -3 },
    { x: 24.3, y: -30 },
    { x: 23.5, y: -32.4 },
    { x: 1, y: -32 },
    { x: -6, y: -4 },
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
};

/** Evaluation order per the doc's "Fault Zones" listing. Zones do not overlap, so order is not load-bearing. */
const ZONE_ORDER: DuvalPentagon1Zone[] = ['PD', 'D1', 'D2', 'T1', 'T2', 'T3', 'S'];

/** Exported for direct, coordinate-level unit testing of the zone classifier in isolation. */
export function classifyDuvalPentagon1Zone(point: DuvalPentagonCoordinate): DuvalPentagon1Zone | null {
  for (const zone of ZONE_ORDER) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) {
      return zone;
    }
  }
  return null;
}

/**
 * IEEE Duval Pentagon 1 method (DUVAL_PENTAGON_1_RULES.md).
 *
 * Computes the shared pentagon coordinate, then performs a point-in-polygon
 * test against each of the seven documented fault zones. Never guesses the
 * nearest zone — a point outside every polygon is reported as OUTSIDE.
 */
export function runDuvalPentagon1Engine(sample: GasSampleInput): DuvalPentagon1Result {
  const coordinates = computeDuvalPentagonCoordinate(sample);

  if (coordinates == null) {
    return {
      diagnosis: null,
      coordinates: null,
      reasoning: [
        'No Duval Pentagon coordinate could be calculated — total hydrocarbon gas is zero, a gas concentration is negative, or the resulting polygon has zero area.',
      ],
    };
  }

  const zone = classifyDuvalPentagon1Zone(coordinates);

  const reasoning = [`Pentagon centroid = (${coordinates.x.toFixed(3)}, ${coordinates.y.toFixed(3)}).`];
  reasoning.push(
    zone == null
      ? 'The centroid does not lie inside any defined Duval Pentagon 1 fault zone.'
      : `Centroid lies inside fault zone ${zone}.`,
  );

  return {
    diagnosis: zone ?? 'OUTSIDE',
    coordinates,
    reasoning,
  };
}
