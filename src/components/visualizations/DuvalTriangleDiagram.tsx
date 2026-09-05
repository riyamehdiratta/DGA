import { useId, useState } from 'react';
import { DuvalCard } from './DuvalCard';
import { DuvalTooltip } from './DuvalTooltip';
import { svgPolygonPath, ternaryToSvg, TRI_VERTICES, TRI_VIEW } from './duvalGeometry';
import type { SvgPoint } from './duvalGeometry';
import { FAULT_ZONE_STYLES } from './duvalZones';
import type { TernaryTriple, TriangleSpec, TriangleVertexPosition } from './duvalZones';

interface DuvalTriangleDiagramProps {
  title: string;
  subtitle?: string;
  spec: TriangleSpec;
  /** Exact ternary percentages computed by the backend, keyed by gas. */
  percentages: Record<string, number> | null;
  /** Backend-diagnosed zone code. */
  result?: string | null;
  interpretation?: string | null;
  /** Zone code → plain-language meaning, for zone tooltips. */
  zoneDescriptions: Record<string, string>;
  metrics?: { label: string; value: string }[];
}

/**
 * Ternary axis layout, following the official IEEE figures: the axis for the
 * top gas runs up the LEFT edge, the right gas down the RIGHT edge, and the
 * left gas leftward along the BOTTOM edge (each edge is where the remaining
 * third gas is 0 %). Normals point outward; rotations align titles with edges.
 */
const AXES: {
  vertex: TriangleVertexPosition;
  from: SvgPoint;
  to: SvgPoint;
  normal: SvgPoint;
  rotation: number;
  anchor: 'start' | 'middle' | 'end';
  labelDy: number;
  arrow: 'after' | 'before';
}[] = [
  {
    vertex: 'top',
    from: TRI_VERTICES.left,
    to: TRI_VERTICES.top,
    normal: { x: -0.866, y: -0.5 },
    rotation: -60,
    anchor: 'end',
    labelDy: 3,
    arrow: 'after',
  },
  {
    vertex: 'right',
    from: TRI_VERTICES.top,
    to: TRI_VERTICES.right,
    normal: { x: 0.866, y: -0.5 },
    rotation: 60,
    anchor: 'start',
    labelDy: 3,
    arrow: 'after',
  },
  {
    vertex: 'left',
    from: TRI_VERTICES.right,
    to: TRI_VERTICES.left,
    normal: { x: 0, y: 1 },
    rotation: 0,
    anchor: 'middle',
    labelDy: 8,
    arrow: 'before',
  },
];

const TICK_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90];

const VERTEX_LABEL_POSITIONS: Record<
  TriangleVertexPosition,
  { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
> = {
  top: { x: TRI_VERTICES.top.x, y: TRI_VERTICES.top.y - 16, anchor: 'middle' },
  left: { x: TRI_VERTICES.left.x - 12, y: TRI_VERTICES.left.y + 20, anchor: 'end' },
  right: { x: TRI_VERTICES.right.x + 12, y: TRI_VERTICES.right.y + 20, anchor: 'start' },
};

export function DuvalTriangleDiagram({
  title,
  subtitle,
  spec,
  percentages,
  result,
  interpretation,
  zoneDescriptions,
  metrics,
}: DuvalTriangleDiagramProps) {
  const [markerHovered, setMarkerHovered] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const hatchId = useId();

  const vertices = spec.gasOrder.map((gas) => TRI_VERTICES[spec.vertexOf[gas]]) as [
    SvgPoint,
    SvgPoint,
    SvgPoint,
  ];
  const toSvg = (triple: TernaryTriple) => ternaryToSvg(triple, vertices);

  const gasAtVertex = (position: TriangleVertexPosition) =>
    spec.gasOrder.find((gas) => spec.vertexOf[gas] === position)!;

  const marker = percentages
    ? toSvg(spec.gasOrder.map((gas) => percentages[gas]) as unknown as TernaryTriple)
    : null;

  const outline = svgPolygonPath([TRI_VERTICES.top, TRI_VERTICES.right, TRI_VERTICES.left]);

  return (
    <DuvalCard
      title={title}
      subtitle={subtitle}
      result={result}
      interpretation={interpretation}
      metrics={metrics}
    >
      <div className="duval-diagram relative">
        <svg
          viewBox={`0 0 ${TRI_VIEW.w} ${TRI_VIEW.h}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title} diagram`}
        >
          <defs>
            <pattern
              id={hatchId}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a1af" strokeWidth="0.6" opacity="0.45" />
            </pattern>
          </defs>

          {/* Fault zone partitions — the real IEEE table boundaries */}
          {spec.zones.map((zone) => {
            const style = FAULT_ZONE_STYLES[zone.code];
            const isDiagnosed = result != null && zone.code === result;
            const isHovered = hoveredZone === zone.code;
            return (
              <g
                key={zone.code}
                onMouseEnter={() => setHoveredZone(zone.code)}
                onMouseLeave={() => setHoveredZone((z) => (z === zone.code ? null : z))}
              >
                {zone.polygons.map((polygon, i) => {
                  const d = svgPolygonPath(polygon.map(toSvg));
                  return (
                    <g key={i}>
                      <path
                        d={d}
                        fill={isDiagnosed || isHovered ? style.highlight : style.fill}
                        stroke="#64748b"
                        strokeWidth={0.8}
                        strokeLinejoin="round"
                        className="transition-[fill] duration-150 ease-out"
                      >
                        <title>{`${zone.code} — ${zoneDescriptions[zone.code] ?? ''}`}</title>
                      </path>
                      {zone.hatched && (
                        <path d={d} fill={`url(#${hatchId})`} pointerEvents="none" />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Diagnosed zone emphasis, drawn above neighbouring boundaries */}
          {result != null &&
            spec.zones
              .filter((zone) => zone.code === result)
              .map((zone) =>
                zone.polygons.map((polygon, i) => (
                  <path
                    key={`${zone.code}-hl-${i}`}
                    d={svgPolygonPath(polygon.map(toSvg))}
                    fill="none"
                    stroke={FAULT_ZONE_STYLES[zone.code].base}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )),
              )}

          {/* Triangle outline */}
          <path d={outline} fill="none" stroke="#334155" strokeWidth={1.5} strokeLinejoin="round" />

          {/* Percentage tick marks + axis titles */}
          {AXES.map((axis) => {
            const gas = gasAtVertex(axis.vertex);
            const label = spec.gasLabels[gas];
            const mid = {
              x: (axis.from.x + axis.to.x) / 2,
              y: (axis.from.y + axis.to.y) / 2,
            };
            const titlePos = { x: mid.x + axis.normal.x * 40, y: mid.y + axis.normal.y * 40 };
            const titleText = axis.arrow === 'after' ? `% ${label}  →` : `←  % ${label}`;
            return (
              <g key={axis.vertex}>
                {TICK_VALUES.map((value) => {
                  const t = value / 100;
                  const p = {
                    x: axis.from.x + t * (axis.to.x - axis.from.x),
                    y: axis.from.y + t * (axis.to.y - axis.from.y),
                  };
                  const major = value % 20 === 0;
                  const len = major ? 7 : 4;
                  return (
                    <g key={value}>
                      <line
                        x1={p.x}
                        y1={p.y}
                        x2={p.x + axis.normal.x * len}
                        y2={p.y + axis.normal.y * len}
                        stroke="#64748b"
                        strokeWidth={major ? 1 : 0.7}
                      />
                      {major && (
                        <text
                          x={p.x + axis.normal.x * 13}
                          y={p.y + axis.normal.y * 13 + axis.labelDy}
                          textAnchor={axis.anchor}
                          fill="#8492a3"
                          style={{ fontSize: 8.5 }}
                        >
                          {value}
                        </text>
                      )}
                    </g>
                  );
                })}
                <text
                  x={titlePos.x}
                  y={titlePos.y}
                  textAnchor="middle"
                  fill="#475569"
                  fontWeight={600}
                  style={{ fontSize: 11.5 }}
                  transform={
                    axis.rotation !== 0
                      ? `rotate(${axis.rotation}, ${titlePos.x}, ${titlePos.y})`
                      : undefined
                  }
                >
                  {titleText}
                </text>
              </g>
            );
          })}

          {/* Vertex gas labels (100 % of that gas) */}
          {(['top', 'left', 'right'] as const).map((position) => {
            const pos = VERTEX_LABEL_POSITIONS[position];
            return (
              <text
                key={position}
                x={pos.x}
                y={pos.y}
                textAnchor={pos.anchor}
                fill="#1c2733"
                fontWeight={700}
                style={{ fontSize: 13 }}
              >
                {spec.gasLabels[gasAtVertex(position)]}
              </text>
            );
          })}

          {/* Zone code labels */}
          {spec.zones.map((zone) => {
            const style = FAULT_ZONE_STYLES[zone.code];
            const isDiagnosed = result != null && zone.code === result;
            return zone.labels.map((label, i) => {
              const base = toSvg(label.at);
              const pos = { x: base.x + (label.dx ?? 0), y: base.y + (label.dy ?? 0) };
              const external = label.dx != null || label.dy != null;
              const leaderTarget = label.leaderTo ? toSvg(label.leaderTo) : null;
              return (
                <g key={`${zone.code}-label-${i}`} pointerEvents="none">
                  {leaderTarget && (
                    <line
                      x1={pos.x + 2}
                      y1={pos.y - 3.5}
                      x2={leaderTarget.x}
                      y2={leaderTarget.y}
                      stroke="#94a1af"
                      strokeWidth={0.75}
                    />
                  )}
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor={external ? 'end' : 'middle'}
                    fill={isDiagnosed || hoveredZone === zone.code ? style.base : '#475569'}
                    fontWeight={isDiagnosed ? 700 : 600}
                    style={{ fontSize: isDiagnosed ? 13 : label.small ? 10 : 11.5 }}
                    className="transition-[fill] duration-150 ease-out"
                  >
                    {zone.code}
                  </text>
                </g>
              );
            });
          })}

          {/* Backend-computed sample point. The outer group carries the
              position as a CSS transform so a changed result glides the
              marker to its new spot instead of teleporting. */}
          {marker && (
            <g
              className="transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translate(${marker.x}px, ${marker.y}px)` }}
            >
              <g
                onMouseEnter={() => setMarkerHovered(true)}
                onMouseLeave={() => setMarkerHovered(false)}
                style={{
                  cursor: 'default',
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transform: markerHovered ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform 160ms ease-out',
                }}
              >
                <circle cx={0} cy={0} r={18} fill="transparent" />
                <g className="anim-marker">
                  <circle
                    className="anim-marker-ring"
                    cx={0}
                    cy={0}
                    r={11}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={1.25}
                    opacity={0.35}
                  />
                  <circle
                    cx={0}
                    cy={0}
                    r={5.5}
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth={1.75}
                  />
                </g>
              </g>
            </g>
          )}
        </svg>

        {markerHovered && marker && percentages && (
          <DuvalTooltip
            fx={marker.x / TRI_VIEW.w}
            fy={marker.y / TRI_VIEW.h}
            heading={result ?? 'No diagnosis'}
            detail={interpretation}
            rows={spec.gasOrder.map((gas) => ({
              label: `% ${spec.gasLabels[gas]}`,
              value: percentages[gas].toFixed(2),
            }))}
          />
        )}
      </div>
    </DuvalCard>
  );
}
