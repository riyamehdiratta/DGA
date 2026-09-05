import { useState } from 'react';
import { ANATOMY_HOTSPOTS } from '@/content/learn/anatomy';

interface AnatomySectionProps {
  onTryPreset: (presetId: string) => void;
}

/**
 * Schematic cutaway of a power transformer with clickable fault hotspots.
 * Pure presentational SVG in the app's flat "lab diagram" style — every
 * fact shown in the side panel comes from src/content/learn/anatomy.ts.
 */
export function AnatomySection({ onTryPreset }: AnatomySectionProps) {
  const [selectedId, setSelectedId] = useState<string>(ANATOMY_HOTSPOTS[0].id);
  const selected = ANATOMY_HOTSPOTS.find((h) => h.id === selectedId) ?? ANATOMY_HOTSPOTS[0];

  return (
    <div className="anim-rise lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
      {/* ——— Cutaway diagram ——— */}
      <div className="border border-gray-300 bg-white p-4">
        <p className="text-xs text-gray-500">
          Where do faults actually happen? Click a numbered hotspot.
        </p>
        <svg
          viewBox="0 0 480 360"
          className="mt-2 h-auto w-full"
          role="img"
          aria-label="Schematic cutaway of a power transformer with fault hotspots"
        >
          {/* Radiator (right of tank) */}
          <g stroke="#94a1af" strokeWidth="1.5" fill="none">
            <path d="M380 120 H430 M380 250 H430" />
            {[398, 410, 422].map((x) => (
              <line key={x} x1={x} y1={120} x2={x} y2={250} />
            ))}
          </g>
          <text x={430} y={112} fontSize="9" fill="#8492a3" textAnchor="end">
            Radiator
          </text>

          {/* Conservator tank + pipe */}
          <rect x={306} y={24} width={88} height={24} fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
          <path d="M350 48 V70" stroke="#64748b" strokeWidth="1.5" fill="none" />
          <text x={398} y={40} fontSize="9" fill="#8492a3">
            Conservator
          </text>

          {/* Bushings on the lid */}
          {[150, 215, 280].map((x) => (
            <g key={x} stroke="#64748b" strokeWidth="1.5" fill="#f8fafc">
              <line x1={x} y1={22} x2={x} y2={70} stroke="#334155" />
              <rect x={x - 7} y={34} width={14} height={7} />
              <rect x={x - 6} y={44} width={12} height={7} />
              <rect x={x - 5} y={54} width={10} height={7} />
            </g>
          ))}

          {/* Tank shell + oil fill */}
          <rect x={100} y={70} width={280} height={260} fill="#ffffff" stroke="#334155" strokeWidth="2" />
          <rect x={106} y={76} width={268} height={248} fill="#f0f5fa" stroke="none" />
          <text x={104} y={344} fontSize="9" fill="#8492a3">
            Tank (oil-filled)
          </text>

          {/* Core: two limbs + yokes */}
          <g fill="#e2e8f0" stroke="#64748b" strokeWidth="1.25">
            <rect x={146} y={104} width={188} height={16} />
            <rect x={146} y={240} width={188} height={16} />
            <rect x={158} y={120} width={26} height={120} />
            <rect x={296} y={120} width={26} height={120} />
          </g>
          <text x={240} y={98} fontSize="9" fill="#8492a3" textAnchor="middle">
            Core
          </text>

          {/* Windings around each limb (paper-wrapped coils) */}
          {[
            { x: 148, label: 'LV / HV windings' },
            { x: 286, label: null },
          ].map((w) => (
            <g key={w.x}>
              <rect x={w.x} y={128} width={46} height={104} fill="#ffffff" stroke="#0f4c81" strokeWidth="1.5" />
              {[142, 156, 170, 184, 198, 212].map((y) => (
                <line key={y} x1={w.x + 4} y1={y} x2={w.x + 42} y2={y} stroke="#0f4c81" strokeWidth="1" opacity="0.5" />
              ))}
            </g>
          ))}
          <text x={240} y={271} fontSize="9" fill="#8492a3" textAnchor="middle">
            Windings (paper-insulated)
          </text>

          {/* Hotspots */}
          {ANATOMY_HOTSPOTS.map((hotspot) => {
            const active = hotspot.id === selectedId;
            return (
              <g
                key={hotspot.id}
                onClick={() => setSelectedId(hotspot.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`${hotspot.label} hotspot`}
              >
                <circle
                  className={active ? 'anim-hotspot-ring' : undefined}
                  cx={hotspot.at.x}
                  cy={hotspot.at.y}
                  r={11}
                  fill="none"
                  stroke={active ? '#0f4c81' : '#94a1af'}
                  strokeWidth="1.5"
                  opacity={active ? 0.6 : 0}
                />
                <circle
                  cx={hotspot.at.x}
                  cy={hotspot.at.y}
                  r={11}
                  fill={active ? '#0f4c81' : '#ffffff'}
                  stroke={active ? '#0f4c81' : '#64748b'}
                  strokeWidth="1.5"
                  className="transition-[fill,stroke] duration-150"
                />
                <text
                  x={hotspot.at.x}
                  y={hotspot.at.y + 3.5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={active ? '#ffffff' : '#334155'}
                  className="pointer-events-none select-none"
                >
                  {hotspot.number}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hotspot quick nav (also keyboard-accessible) */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ANATOMY_HOTSPOTS.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => setSelectedId(hotspot.id)}
              className={`border px-2 py-1 text-xs transition-colors duration-150 ${
                hotspot.id === selectedId
                  ? 'border-gray-800 bg-gray-900 font-medium text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-500'
              }`}
            >
              {hotspot.number} · {hotspot.label}
            </button>
          ))}
        </div>
      </div>

      {/* ——— Detail panel ——— */}
      <div className="mt-4 border border-gray-300 bg-white lg:mt-0" key={selected.id}>
        <header className="border-b border-gray-200 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Hotspot {selected.number}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-gray-900">{selected.label}</h3>
        </header>
        <div className="anim-rise space-y-3 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              What goes wrong here
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{selected.whatHappens}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Gases it releases
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{selected.gases}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              How the pipeline catches it
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{selected.detectedBy}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Fault codes:
            </span>
            {selected.faultCodes.map((code) => (
              <span
                key={code}
                className="border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-xs font-bold text-gray-800"
              >
                {code}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onTryPreset(selected.presetId)}
            className="mt-1 w-full border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-gray-700"
          >
            See it in the Gas Lab — load “{selected.presetLabel}” →
          </button>
        </div>
      </div>
    </div>
  );
}
