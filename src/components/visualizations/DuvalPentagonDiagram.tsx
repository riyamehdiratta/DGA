import { useState } from 'react';
import { DuvalCard } from './DuvalCard';
import { DuvalTooltip } from './DuvalTooltip';
import {
  PENT_CENTER,
  PENT_RENDER_VERTICES,
  PENT_VIEW,
  pentagonToSvg,
  svgPolygonPath,
} from './duvalGeometry';
import { FAULT_ZONE_STYLES } from './duvalZones';
import type { PentagonZone } from './duvalZones';
import type { DuvalPentagonCoordinate } from './types';

interface DuvalPentagonDiagramProps {
  title: string;
  subtitle?: string;
  zones: PentagonZone[];
  /** Exact centroid coordinate computed by the backend (doc convention, y-up). */
  coordinates: DuvalPentagonCoordinate | null;
  /** Backend-diagnosed zone code. */
  result?: string | null;
  interpretation?: string | null;
  /** Zone code → plain-language meaning, for zone tooltips. */
  zoneDescriptions: Record<string, string>;
  metrics?: { label: string; value: string }[];
}

/** Gas label placement around each vertex, in PENT_RENDER_VERTICES order. */
const VERTEX_LABEL_OFFSETS: { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }[] = [
  { dx: 0, dy: -12, anchor: 'middle' },
  { dx: 13, dy: 4, anchor: 'start' },
  { dx: 8, dy: 17, anchor: 'start' },
  { dx: -8, dy: 17, anchor: 'end' },
  { dx: -13, dy: 4, anchor: 'end' },
];

const AXIS_TICK_RADII = [10, 20, 30];

export function DuvalPentagonDiagram({
  title,
  subtitle,
  zones,
  coordinates,
  result,
  interpretation,
  zoneDescriptions,
  metrics,
}: DuvalPentagonDiagramProps) {
  const [markerHovered, setMarkerHovered] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const outline = svgPolygonPath(PENT_RENDER_VERTICES.map(pentagonToSvg));
  const marker = coordinates ? pentagonToSvg(coordinates) : null;

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
          viewBox={`0 0 ${PENT_VIEW.w} ${PENT_VIEW.h}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title} diagram`}
        >
          {/* Fault zone partitions — verbatim IEEE polygon coordinates */}
          {zones.map((zone) => {
            const style = FAULT_ZONE_STYLES[zone.code];
            const isDiagnosed = result != null && zone.code === result;
            const isHovered = hoveredZone === zone.code;
            return (
              <path
                key={zone.code}
                d={svgPolygonPath(zone.polygon.map(pentagonToSvg))}
                fill={isDiagnosed || isHovered ? style.highlight : style.fill}
                stroke="#64748b"
                strokeWidth={0.8}
                strokeLinejoin="round"
                className="transition-[fill] duration-150 ease-out"
                onMouseEnter={() => setHoveredZone(zone.code)}
                onMouseLeave={() => setHoveredZone((z) => (z === zone.code ? null : z))}
              >
                <title>{`${zone.code} — ${zoneDescriptions[zone.code] ?? ''}`}</title>
              </path>
            );
          })}

          {/* Gas axes: center → vertex, with 10/20/30 % tick marks */}
          {PENT_RENDER_VERTICES.map((vertex, i) => {
            const magnitude = Math.hypot(vertex.x, vertex.y);
            const u = { x: vertex.x / magnitude, y: vertex.y / magnitude };
            const end = pentagonToSvg(vertex);
            return (
              <g key={vertex.gas}>
                <line
                  x1={PENT_CENTER.x}
                  y1={PENT_CENTER.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#c3cad2"
                  strokeWidth={0.75}
                  strokeDasharray="3 3"
                />
                {AXIS_TICK_RADII.map((r) => {
                  const p = pentagonToSvg({ x: u.x * r, y: u.y * r });
                  // Perpendicular to the axis direction, in SVG space.
                  const perp = { x: u.y, y: u.x };
                  return (
                    <g key={r}>
                      <line
                        x1={p.x - perp.x * 3}
                        y1={p.y - perp.y * 3}
                        x2={p.x + perp.x * 3}
                        y2={p.y + perp.y * 3}
                        stroke="#8492a3"
                        strokeWidth={0.9}
                      />
                      {i === 0 && (
                        <text
                          x={p.x + 7}
                          y={p.y + 3}
                          textAnchor="start"
                          fill="#8492a3"
                          style={{ fontSize: 8.5 }}
                        >
                          {r}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Center origin mark */}
          <g stroke="#8492a3" strokeWidth={0.9}>
            <line x1={PENT_CENTER.x - 4} y1={PENT_CENTER.y} x2={PENT_CENTER.x + 4} y2={PENT_CENTER.y} />
            <line x1={PENT_CENTER.x} y1={PENT_CENTER.y - 4} x2={PENT_CENTER.x} y2={PENT_CENTER.y + 4} />
          </g>

          {/* Diagnosed zone emphasis, drawn above the axis layer */}
          {result != null &&
            zones
              .filter((zone) => zone.code === result)
              .map((zone) => (
                <path
                  key={`${zone.code}-hl`}
                  d={svgPolygonPath(zone.polygon.map(pentagonToSvg))}
                  fill="none"
                  stroke={FAULT_ZONE_STYLES[zone.code].base}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              ))}

          {/* Pentagon outline */}
          <path d={outline} fill="none" stroke="#334155" strokeWidth={1.5} strokeLinejoin="round" />

          {/* Vertex gas labels */}
          {PENT_RENDER_VERTICES.map((vertex, i) => {
            const p = pentagonToSvg(vertex);
            const offset = VERTEX_LABEL_OFFSETS[i];
            return (
              <text
                key={vertex.gas}
                x={p.x + offset.dx}
                y={p.y + offset.dy}
                textAnchor={offset.anchor}
                fill="#1c2733"
                fontWeight={700}
                style={{ fontSize: 13 }}
              >
                {vertex.gas}
              </text>
            );
          })}

          {/* Zone code labels */}
          {zones.map((zone) => {
            const style = FAULT_ZONE_STYLES[zone.code];
            const isDiagnosed = result != null && zone.code === result;
            return zone.labels.map((label, i) => {
              const pos = pentagonToSvg(label.at);
              const leaderTarget = label.leaderTo ? pentagonToSvg(label.leaderTo) : null;
              return (
                <g key={`${zone.code}-label-${i}`} pointerEvents="none">
                  {leaderTarget && (
                    <line
                      x1={pos.x + 2}
                      y1={pos.y + 2}
                      x2={leaderTarget.x}
                      y2={leaderTarget.y}
                      stroke="#94a1af"
                      strokeWidth={0.75}
                    />
                  )}
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor={leaderTarget ? 'end' : 'middle'}
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

          {/* Scale caption */}
          <text x={12} y={PENT_VIEW.h - 8} fill="#8492a3" style={{ fontSize: 8.5 }}>
            Axes: relative % of Σ(H₂, C₂H₆, CH₄, C₂H₄, C₂H₂) · ticks every 10 % · outline = 40 %
          </text>

          {/* Backend-computed centroid coordinate. The outer group carries
              the position as a CSS transform so a changed result glides the
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

        {markerHovered && marker && coordinates && (
          <DuvalTooltip
            fx={marker.x / PENT_VIEW.w}
            fy={marker.y / PENT_VIEW.h}
            heading={result ?? 'No diagnosis'}
            detail={interpretation}
            rows={[
              { label: 'Cx', value: coordinates.x.toFixed(2) },
              { label: 'Cy', value: coordinates.y.toFixed(2) },
            ]}
          />
        )}
      </div>
    </DuvalCard>
  );
}
