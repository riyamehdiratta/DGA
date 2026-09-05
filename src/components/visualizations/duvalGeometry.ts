import type { PentagonPoint, TernaryTriple } from './duvalZones';

/**
 * Coordinate transforms shared by the Duval diagrams. Pure presentational
 * math — inputs are the backend's exact percentages/coordinates and the only
 * job here is projecting them into SVG space.
 */

export interface SvgPoint {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Triangles — equilateral, side 360, drawn in a 500 × 430 viewBox with room
// for external tick marks, axis titles, and vertex gas labels.
// ---------------------------------------------------------------------------

export const TRI_VIEW = { w: 500, h: 430 } as const;

/** Equilateral triangle vertices (height = 360·sin 60° ≈ 311.77). */
export const TRI_VERTICES: Record<'top' | 'left' | 'right', SvgPoint> = {
  top: { x: 250, y: 48.23 },
  left: { x: 70, y: 360 },
  right: { x: 430, y: 360 },
};

/**
 * Projects a ternary triple (percentages in the order of `vertices`) onto the
 * triangle. Normalizes by the actual sum so the backend's exact percentages
 * land precisely even with floating-point residue around 100.
 */
export function ternaryToSvg(
  triple: TernaryTriple,
  vertices: readonly [SvgPoint, SvgPoint, SvgPoint],
): SvgPoint {
  const sum = triple[0] + triple[1] + triple[2];
  if (sum <= 0) {
    return {
      x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
      y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3,
    };
  }
  return {
    x: (triple[0] * vertices[0].x + triple[1] * vertices[1].x + triple[2] * vertices[2].x) / sum,
    y: (triple[0] * vertices[0].y + triple[1] * vertices[1].y + triple[2] * vertices[2].y) / sum,
  };
}

export function svgPolygonPath(points: SvgPoint[]): string {
  return (
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') +
    ' Z'
  );
}

// ---------------------------------------------------------------------------
// Pentagons — the docs' fixed rendering geometry (H₂ vertex at (0, 40), y-up)
// mapped into a 500 × 430 viewBox. 1 doc unit = 1 % of total gas.
// ---------------------------------------------------------------------------

export const PENT_VIEW = { w: 500, h: 430 } as const;
export const PENT_CENTER = { x: 250, y: 222 } as const;
export const PENT_SCALE = 3.35;

/** Doc coordinate (y-up, origin at pentagon center) → SVG coordinate. */
export function pentagonToSvg(p: PentagonPoint): SvgPoint {
  return {
    x: PENT_CENTER.x + p.x * PENT_SCALE,
    y: PENT_CENTER.y - p.y * PENT_SCALE,
  };
}

/**
 * Full-scale (40 %) rendering vertices from DUVAL_PENTAGON_1_RULES.md, in the
 * docs' clockwise order of increasing fault energy.
 */
export const PENT_RENDER_VERTICES: { gas: string; x: number; y: number }[] = [
  { gas: 'H₂', x: 0, y: 40 },
  { gas: 'C₂H₂', x: 38, y: 12.4 },
  { gas: 'C₂H₄', x: 23.5, y: -32.4 },
  { gas: 'CH₄', x: -23.5, y: -32.4 },
  { gas: 'C₂H₆', x: -38, y: 12.4 },
];
