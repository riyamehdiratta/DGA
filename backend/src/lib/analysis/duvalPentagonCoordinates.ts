import type { DuvalPentagonCoordinate, GasSampleInput } from './types.js';

/**
 * Duval Pentagon coordinate transform (DUVAL_PENTAGON_1_RULES.md, "Duval
 * Pentagon Coordinate Algorithm" section). Shared by Pentagon 1 and Pentagon
 * 2 — DUVAL_PENTAGON_2_RULES.md explicitly requires reusing this unchanged
 * rather than duplicating it.
 *
 * Fixed axis angles (never change): H2=90°, C2H6=162°, CH4=234°, C2H4=306°,
 * C2H2=18°. Vertex order (H2 → C2H6 → CH4 → C2H4 → C2H2 → back to H2) is
 * required by the Shoelace Formula / centroid computation and must not be
 * reordered.
 */
const PENTAGON_GAS_ORDER = ['h2', 'c2h6', 'ch4', 'c2h4', 'c2h2'] as const;

const PENTAGON_AXIS_ANGLES_DEG: Record<(typeof PENTAGON_GAS_ORDER)[number], number> = {
  h2: 90,
  c2h6: 162,
  ch4: 234,
  c2h4: 306,
  c2h2: 18,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts a DGA sample into a single Duval Pentagon centroid coordinate.
 *
 * Returns null when no coordinate can be calculated: total = 0 (division by
 * zero), a negative gas concentration (invalid input — never silently
 * coerced to zero), or a degenerate zero-area polygon (e.g. a single gas at
 * 100% collapses the pentagon to a line segment).
 */
export function computeDuvalPentagonCoordinate(
  sample: GasSampleInput,
): DuvalPentagonCoordinate | null {
  const { h2, ch4, c2h6, c2h4, c2h2 } = sample;

  if (h2 < 0 || ch4 < 0 || c2h6 < 0 || c2h4 < 0 || c2h2 < 0) {
    return null;
  }

  const total = h2 + ch4 + c2h6 + c2h4 + c2h2;
  if (total <= 0) {
    return null;
  }

  const gasValues: Record<(typeof PENTAGON_GAS_ORDER)[number], number> = {
    h2,
    c2h6,
    ch4,
    c2h4,
    c2h2,
  };

  // Steps 2-5: percentages, then project each gas onto its fixed axis.
  const points = PENTAGON_GAS_ORDER.map((gas) => {
    const percentage = (gasValues[gas] / total) * 100;
    const angle = toRadians(PENTAGON_AXIS_ANGLES_DEG[gas]);
    return { x: percentage * Math.cos(angle), y: percentage * Math.sin(angle) };
  });

  // Step 7: close the polygon by appending the first point.
  const closed = [...points, points[0]];

  // Step 8: Shoelace signed area.
  let signedArea = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    const { x: xi, y: yi } = closed[i];
    const { x: xi1, y: yi1 } = closed[i + 1];
    signedArea += xi * yi1 - xi1 * yi;
  }
  signedArea *= 0.5;

  if (signedArea === 0) {
    return null;
  }

  // Steps 9-10: centroid, using the signed (not absolute) area.
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    const { x: xi, y: yi } = closed[i];
    const { x: xi1, y: yi1 } = closed[i + 1];
    const cross = xi * yi1 - xi1 * yi;
    cx += (xi + xi1) * cross;
    cy += (yi + yi1) * cross;
  }
  cx /= 6 * signedArea;
  cy /= 6 * signedArea;

  return { x: cx, y: cy };
}

/**
 * Standard ray-casting (even-odd rule) point-in-polygon test. Shared by the
 * Pentagon 1 and Pentagon 2 zone classifiers — same test, different polygons.
 */
export function isPointInPolygon(
  point: DuvalPentagonCoordinate,
  polygon: DuvalPentagonCoordinate[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i];
    const { x: xj, y: yj } = polygon[j];
    const intersects =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}
