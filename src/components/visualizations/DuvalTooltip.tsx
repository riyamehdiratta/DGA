export interface DuvalTooltipProps {
  /** Marker position as a fraction (0–1) of the diagram viewBox. */
  fx: number;
  fy: number;
  heading: string;
  detail?: string | null;
  rows: { label: string; value: string }[];
}

/**
 * Hover tooltip anchored to the Duval sample marker. Shows the backend's
 * diagnosis and exact coordinates verbatim — nothing here is computed.
 * Positioned in fractional coordinates so it tracks the responsive SVG.
 */
export function DuvalTooltip({ fx, fy, heading, detail, rows }: DuvalTooltipProps) {
  const tx = fx < 0.22 ? '-12%' : fx > 0.78 ? '-88%' : '-50%';
  const ty = fy < 0.3 ? '16px' : 'calc(-100% - 16px)';

  return (
    <div
      className="pointer-events-none absolute z-10 min-w-40 border border-gray-300 bg-white px-2.5 py-2 text-xs shadow-[0_2px_8px_rgba(28,39,51,0.14)]"
      style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, transform: `translate(${tx}, ${ty})` }}
      role="status"
    >
      <p className="font-semibold text-gray-900">{heading}</p>
      {detail && <p className="mt-0.5 text-[11px] leading-snug text-gray-600">{detail}</p>}
      <dl className="mt-1.5 space-y-0.5 border-t border-gray-200 pt-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="font-mono tabular-nums text-gray-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
