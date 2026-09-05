/**
 * Presentational geometry for the Duval Triangle and Pentagon diagrams.
 *
 * TRIANGLES — zone polygons are derived analytically from the IEEE C57.104-2019
 * boundary tables in docs/DUVAL_TRIANGLE_RULES.md (Table 6, Table D.3, Table
 * D.4): every % threshold in a table is a straight line parallel to one
 * triangle edge, so each fault zone is the polygon enclosed by its rows'
 * thresholds. The polygons below partition the triangle exactly as the
 * backend's rule engine (backend/src/lib/analysis/duvalTriangle.ts) does —
 * they are drawings of the same tables, never an alternative classifier.
 *
 * PENTAGONS — zone polygons transcribed verbatim from
 * docs/DUVAL_PENTAGON_{1,2}_RULES.md, i.e. numerically identical to the
 * backend's ZONE_POLYGONS. Coordinates use the docs' convention: origin at the
 * pentagon center, y-up, H₂ vertex at (0, 40).
 *
 * Diagnosis always comes from the backend; this file only says where to draw.
 */

/** One point in a triangle zone polygon, in the spec's `gasOrder` (sums to 100). */
export type TernaryTriple = readonly [number, number, number];

export interface ZoneStyle {
  /** Saturated hue — highlight stroke and emphasized label. */
  base: string;
  /** Resting pastel fill. */
  fill: string;
  /** Stronger fill for the backend-diagnosed zone. */
  highlight: string;
}

/**
 * One color per IEEE fault code, consistent across all five diagrams.
 * Cool hues = electrical (PD/D1/D2), warm ramp = thermal severity (T1→T3),
 * green = stray gassing (not a fault), neutral = not determined.
 * Base hues validated with the dataviz palette checker; zone identity is
 * always carried by the printed code label, never by color alone.
 */
export const FAULT_ZONE_STYLES: Record<string, ZoneStyle> = {
  PD: { base: '#7c3aed', fill: '#f2ecfd', highlight: '#e2d5fb' },
  D1: { base: '#0284c7', fill: '#e4f3fc', highlight: '#c9e6f8' },
  D2: { base: '#1d4ed8', fill: '#e5ebfc', highlight: '#cdd9f9' },
  DT: { base: '#db2777', fill: '#fce9f2', highlight: '#f8cfe4' },
  T1: { base: '#b45309', fill: '#fdf1e1', highlight: '#f8dfba' },
  T2: { base: '#ea580c', fill: '#fdecdf', highlight: '#fad4b8' },
  T3: { base: '#dc2626', fill: '#fde9e9', highlight: '#f9cccc' },
  'T3-H': { base: '#dc2626', fill: '#fde9e9', highlight: '#f9cccc' },
  S: { base: '#15803d', fill: '#e8f6ee', highlight: '#ccecda' },
  O: { base: '#a16207', fill: '#fbf3d9', highlight: '#f5e3ac' },
  C: { base: '#92400e', fill: '#f7ede2', highlight: '#edd6bd' },
  ND: { base: '#64748b', fill: '#f1f4f7', highlight: '#dde4eb' },
};

export interface TriangleZoneLabel {
  /** Anchor position in ternary coordinates (spec `gasOrder`, sums to 100). */
  at: TernaryTriple;
  /** Extra offset in SVG px — used to push labels of sliver zones outside. */
  dx?: number;
  dy?: number;
  /** Ternary point to connect the (external) label to with a leader line. */
  leaderTo?: TernaryTriple;
  small?: boolean;
}

export interface TriangleZone {
  code: string;
  /** One or more polygons (a zone may be disjoint, e.g. O in Triangle 5). */
  polygons: TernaryTriple[][];
  labels: TriangleZoneLabel[];
  /** Render a subtle diagonal hatch on top of the fill (ND = "no diagnosis"). */
  hatched?: boolean;
}

export type TriangleVertexPosition = 'top' | 'left' | 'right';

export interface TriangleSpec {
  /**
   * Keys of the backend `percentages` object in the order used by every
   * polygon triple — the docs' table column order.
   */
  gasOrder: readonly [string, string, string];
  /** Vertex each gas occupies, matching the official IEEE figure orientation. */
  vertexOf: Record<string, TriangleVertexPosition>;
  gasLabels: Record<string, string>;
  zones: TriangleZone[];
}

/** Triangle 1 — Table 6. Triples are [%CH₄, %C₂H₄, %C₂H₂]. */
export const TRIANGLE1_SPEC: TriangleSpec = {
  gasOrder: ['ch4', 'c2h4', 'c2h2'],
  vertexOf: { ch4: 'top', c2h4: 'right', c2h2: 'left' },
  gasLabels: { ch4: 'CH₄', c2h4: 'C₂H₄', c2h2: 'C₂H₂' },
  zones: [
    {
      code: 'PD',
      polygons: [[[100, 0, 0], [98, 2, 0], [98, 0, 2]]],
      labels: [{ at: [98, 1, 1], dx: -30, dy: 2, leaderTo: [98.7, 0.65, 0.65], small: true }],
    },
    {
      code: 'T1',
      polygons: [[[98, 2, 0], [80, 20, 0], [76, 20, 4], [96, 0, 4], [98, 0, 2]]],
      labels: [{ at: [88, 10, 2] }],
    },
    {
      code: 'T2',
      polygons: [[[80, 20, 0], [50, 50, 0], [46, 50, 4], [76, 20, 4]]],
      labels: [{ at: [64, 34, 2] }],
    },
    {
      code: 'T3',
      polygons: [[[50, 50, 0], [0, 100, 0], [0, 85, 15], [35, 50, 15]]],
      labels: [{ at: [25, 68, 7] }],
    },
    {
      code: 'DT',
      polygons: [
        [
          [96, 0, 4], [46, 50, 4], [35, 50, 15], [0, 85, 15],
          [0, 71, 29], [31, 40, 29], [47, 40, 13], [87, 0, 13],
        ],
      ],
      labels: [{ at: [67, 25, 8] }, { at: [25, 55, 20], small: true }],
    },
    {
      code: 'D1',
      polygons: [[[87, 0, 13], [64, 23, 13], [0, 23, 77], [0, 0, 100]]],
      labels: [{ at: [40, 10, 50] }],
    },
    {
      code: 'D2',
      polygons: [[[64, 23, 13], [47, 40, 13], [31, 40, 29], [0, 71, 29], [0, 23, 77]]],
      labels: [{ at: [30, 32, 38] }],
    },
  ],
};

/**
 * Triangle 4 — Table D.3. Triples are [%H₂, %CH₄, %C₂H₆].
 *
 * Vertex assignment (H₂ apex, C₂H₆ bottom-left, CH₄ bottom-right) matches
 * the official IEEE Figure D.3 orientation — verified against a reference
 * rendering (docs/demo-data), which showed our earlier ch4-left/c2h6-right
 * assignment had C and ND mirror-flipped left-right relative to the correct
 * figure. The zone polygon coordinates below are in percentage space and are
 * unaffected by this — only vertexOf determines screen position.
 */
export const TRIANGLE4_SPEC: TriangleSpec = {
  gasOrder: ['h2', 'ch4', 'c2h6'],
  vertexOf: { h2: 'top', ch4: 'right', c2h6: 'left' },
  gasLabels: { h2: 'H₂', ch4: 'CH₄', c2h6: 'C₂H₆' },
  zones: [
    {
      code: 'PD',
      polygons: [[[98, 2, 0], [85, 15, 0], [84, 15, 1], [97, 2, 1]]],
      labels: [{ at: [91, 8.5, 0.5], dx: -30, dy: 2, leaderTo: [91, 8.6, 0.4], small: true }],
    },
    {
      code: 'S',
      polygons: [
        [
          [100, 0, 0], [98, 2, 0], [97, 2, 1], [84, 15, 1], [85, 15, 0], [64, 36, 0],
          [40, 36, 24], [15, 61, 24], [15, 55, 30], [9, 61, 30], [9, 45, 46], [54, 0, 46],
        ],
      ],
      labels: [{ at: [50, 30, 20] }],
    },
    {
      code: 'O',
      polygons: [[[9, 61, 30], [0, 70, 30], [0, 0, 100], [9, 0, 91]]],
      labels: [{ at: [4, 51, 45] }],
    },
    {
      // Two disjoint regions.
      //
      // Main region: not just Table D.3's literal C rows (H₂<15 strip at
      // 24–30 % C₂H₆) but also the much larger area at C₂H₆<24 % that no
      // table row technically covers (S3 needs %CH₄<36, so for %CH₄≥36 with
      // low %C₂H₆ nothing in PD/S/O/C1/C2/ND fires). Official Figure D.3
      // draws this uncovered area as part of C with no visible gap — matches
      // verified check-order transitions at %C₂H₆=30 (boundary drops from
      // H₂=9 to H₂=15) and %C₂H₆=24 (boundary jumps from H₂=15 to the
      // %CH₄=36 diagonal, H₂=64−%C₂H₆) — so it is filled here the same way.
      // The backend's classification is untouched by this; a sample landing
      // in the fill area still correctly returns UNCLASSIFIED there.
      //
      // A table technicality also lets C1 (CH₄≥36 & C₂H₆≥24) outrank ND in a
      // tiny corner (H₂∈[9,18], CH₄∈[36,45], C₂H₆∈[46,55]) purely because C is
      // checked before ND. Figure D.3 draws ND as one clean, un-notched
      // triangle with no visible C intrusion there, so that corner is left
      // out of this drawing too — visual-only, the backend still returns C
      // for a sample actually landing in it.
      code: 'C',
      polygons: [
        [
          [0, 70, 30], [9, 61, 30], [15, 55, 30], [15, 61, 24],
          [40, 36, 24], [64, 36, 0], [0, 100, 0],
        ],
      ],
      labels: [{ at: [35, 50, 15] }],
    },
    {
      code: 'ND',
      polygons: [[[54, 0, 46], [9, 0, 91], [9, 45, 46]]],
      labels: [{ at: [15, 20, 65] }],
      hatched: true,
    },
  ],
};

/** Triangle 5 — Table D.4. Triples are [%CH₄, %C₂H₄, %C₂H₆]. */
export const TRIANGLE5_SPEC: TriangleSpec = {
  gasOrder: ['ch4', 'c2h4', 'c2h6'],
  vertexOf: { ch4: 'top', c2h4: 'right', c2h6: 'left' },
  gasLabels: { ch4: 'CH₄', c2h4: 'C₂H₄', c2h6: 'C₂H₆' },
  zones: [
    {
      code: 'PD',
      polygons: [[[98, 0, 2], [97, 1, 2], [85, 1, 14], [86, 0, 14]]],
      labels: [{ at: [92, 0.5, 7.5], dx: -30, dy: 2, leaderTo: [91.5, 0.6, 7.9], small: true }],
    },
    {
      code: 'O',
      polygons: [
        [[100, 0, 0], [99, 1, 0], [97, 1, 2], [98, 0, 2]],
        [[97, 1, 2], [88, 10, 2], [76, 10, 14], [85, 1, 14]],
        [[46, 0, 54], [36, 10, 54], [0, 10, 90], [0, 0, 100]],
      ],
      labels: [{ at: [85, 5, 10], small: true }, { at: [16, 4, 80] }],
    },
    {
      code: 'S',
      polygons: [[[86, 0, 14], [76, 10, 14], [36, 10, 54], [46, 0, 54]]],
      labels: [{ at: [60, 5, 35] }],
    },
    {
      code: 'T2',
      polygons: [[[90, 10, 0], [65, 35, 0], [53, 35, 12], [78, 10, 12]]],
      labels: [{ at: [71, 22, 7] }],
    },
    {
      code: 'T3',
      polygons: [
        [[65, 35, 0], [0, 100, 0], [0, 70, 30], [16, 70, 14], [36, 50, 14], [38, 50, 12], [53, 35, 12]],
        [[35, 35, 30], [0, 70, 30], [0, 35, 65]],
      ],
      labels: [{ at: [35, 58, 7] }, { at: [12, 47, 41], small: true }],
    },
    {
      code: 'C',
      polygons: [[[78, 10, 12], [38, 50, 12], [36, 50, 14], [16, 70, 14], [0, 70, 30], [60, 10, 30]]],
      labels: [{ at: [35, 45, 20] }],
    },
    {
      code: 'ND',
      polygons: [[[60, 10, 30], [35, 35, 30], [0, 35, 65], [0, 10, 90]]],
      labels: [{ at: [25, 22, 53] }],
      hatched: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Pentagons — doc coordinate system: origin at center, y-up, H₂ vertex (0,40).
// ---------------------------------------------------------------------------

export interface PentagonPoint {
  x: number;
  y: number;
}

export interface PentagonZoneLabel {
  at: PentagonPoint;
  leaderTo?: PentagonPoint;
  small?: boolean;
}

export interface PentagonZone {
  code: string;
  polygon: PentagonPoint[];
  labels: PentagonZoneLabel[];
}

const PENTAGON_PD: PentagonZone = {
  code: 'PD',
  polygon: [
    { x: 0, y: 33 }, { x: -1, y: 33 }, { x: -1, y: 24.5 }, { x: 0, y: 24.5 },
  ],
  labels: [{ at: { x: -13, y: 45 }, leaderTo: { x: -0.9, y: 30 }, small: true }],
};

const PENTAGON_D1: PentagonZone = {
  code: 'D1',
  polygon: [
    { x: 0, y: 40 }, { x: 38, y: 12 }, { x: 32, y: -6.1 }, { x: 4, y: 16 }, { x: 0, y: 1.5 },
  ],
  labels: [{ at: { x: 18, y: 20 } }],
};

const PENTAGON_D2: PentagonZone = {
  code: 'D2',
  polygon: [
    { x: 4, y: 16 }, { x: 32, y: -6.1 }, { x: 24.3, y: -30 }, { x: 0, y: -3 }, { x: 0, y: 1.5 },
  ],
  labels: [{ at: { x: 13, y: -2 } }],
};

const PENTAGON_S: PentagonZone = {
  code: 'S',
  polygon: [
    { x: 0, y: 1.5 }, { x: -35, y: 3.1 }, { x: -38, y: 12.4 }, { x: 0, y: 40 },
    { x: 0, y: 33 }, { x: -1, y: 33 }, { x: -1, y: 24.5 }, { x: 0, y: 24.5 },
  ],
  labels: [{ at: { x: -21, y: 17 } }],
};

/** Duval Pentagon 1 fault zones (DUVAL_PENTAGON_1_RULES.md). */
export const PENTAGON1_ZONES: PentagonZone[] = [
  PENTAGON_PD,
  PENTAGON_D1,
  PENTAGON_D2,
  {
    code: 'T3',
    polygon: [
      { x: 0, y: -3 }, { x: 24.3, y: -30 }, { x: 23.5, y: -32.4 }, { x: 1, y: -32 }, { x: -6, y: -4 },
    ],
    labels: [{ at: { x: 9, y: -20 } }],
  },
  {
    code: 'T2',
    polygon: [{ x: -6, y: -4 }, { x: 1, y: -32.4 }, { x: -22.5, y: -32.4 }],
    labels: [{ at: { x: -9, y: -23 } }],
  },
  {
    code: 'T1',
    polygon: [
      { x: -6, y: -4 }, { x: -22.5, y: -32.4 }, { x: -23.5, y: -32.4 },
      { x: -35, y: 3 }, { x: 0, y: 1.5 }, { x: 0, y: -3 },
    ],
    labels: [{ at: { x: -16, y: -12 } }],
  },
  PENTAGON_S,
];

/** Duval Pentagon 2 fault zones (DUVAL_PENTAGON_2_RULES.md). */
export const PENTAGON2_ZONES: PentagonZone[] = [
  PENTAGON_PD,
  PENTAGON_D1,
  PENTAGON_D2,
  PENTAGON_S,
  {
    code: 'O',
    polygon: [
      { x: -3.5, y: -3 }, { x: -11, y: -8 }, { x: -21.5, y: -32.4 }, { x: -23.5, y: -32.4 },
      { x: -35, y: 3.1 }, { x: 0, y: 1.5 }, { x: 0, y: -3 },
    ],
    labels: [{ at: { x: -21, y: -11 } }],
  },
  {
    code: 'C',
    polygon: [
      { x: -3.5, y: -3 }, { x: 2.5, y: -32.4 }, { x: -21.5, y: -32.4 }, { x: -11, y: -8 },
    ],
    labels: [{ at: { x: -8, y: -22 } }],
  },
  {
    code: 'T3-H',
    polygon: [
      { x: 0, y: -3 }, { x: 24.3, y: -30 }, { x: 23.5, y: -32.4 }, { x: 2.5, y: -32.4 }, { x: -3.5, y: -3 },
    ],
    labels: [{ at: { x: 10, y: -19 }, small: true }],
  },
];
