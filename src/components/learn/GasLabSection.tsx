import { useEffect, useRef, useState } from 'react';
import { runSandboxApi } from '@/api/learn';
import type { SandboxGasInput, SandboxRunResponse } from '@/api/learn';
import { FAULT_PRESETS, getPreset } from '@/content/learn/presets';
import { DuvalTriangle1, DuvalTriangle4, DuvalTriangle5 } from '@/components/visualizations/DuvalTriangles';
import { DuvalPentagon1, DuvalPentagon2 } from '@/components/visualizations/DuvalPentagons';
import type { DoernenburgResult, KeyGasResult } from '@/types';

export interface PresetRequest {
  presetId: string;
  /** Changes on every request so the same preset can be re-applied. */
  token: number;
}

interface GasLabSectionProps {
  presetRequest: PresetRequest | null;
}

const GAS_SLIDERS: { key: keyof SandboxGasInput; label: string; max: number; step: number }[] = [
  { key: 'h2', label: 'H₂ Hydrogen', max: 2000, step: 1 },
  { key: 'ch4', label: 'CH₄ Methane', max: 1000, step: 1 },
  { key: 'c2h6', label: 'C₂H₆ Ethane', max: 500, step: 1 },
  { key: 'c2h4', label: 'C₂H₄ Ethylene', max: 1000, step: 1 },
  { key: 'c2h2', label: 'C₂H₂ Acetylene', max: 800, step: 1 },
  { key: 'co', label: 'CO Carbon monoxide', max: 2000, step: 1 },
  { key: 'co2', label: 'CO₂ Carbon dioxide', max: 10000, step: 10 },
];

const KEY_GAS_LABELS: Record<KeyGasResult['diagnosis'], string> = {
  THERMAL_OIL: 'Thermal — Oil',
  THERMAL_CELLULOSE: 'Thermal — Cellulose',
  PARTIAL_DISCHARGE: 'Partial Discharge',
  ARCING: 'Arcing',
  INCONCLUSIVE: 'Inconclusive',
};

const DOERNENBURG_LABELS: Record<DoernenburgResult['diagnosis'], string> = {
  THERMAL_DECOMPOSITION: 'Thermal Decomposition',
  CORONA: 'Corona',
  ARCING: 'Arcing',
  INCONCLUSIVE: 'Inconclusive',
};

const TRIANGLE_WARNING_NOTES: Record<string, string> = {
  low_gas_levels:
    'Gas levels are very low — the triangle plots proportions, so even a healthy transformer lands somewhere. Treat the zone as unreliable at these levels.',
  near_boundary:
    'The point sits close to a zone boundary — small measurement errors could move it into the neighbouring zone.',
};

function VerdictCard({
  title,
  subtitle,
  verdict,
  detail,
  extra,
}: {
  title: string;
  subtitle: string;
  verdict: string;
  detail: string | null;
  extra?: React.ReactNode;
}) {
  return (
    <section className="border border-gray-300 bg-white">
      <header className="flex items-baseline justify-between gap-2 border-b border-gray-200 px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="inline-block whitespace-nowrap border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white">
          {verdict}
        </span>
      </header>
      <div className="px-4 py-3">
        {detail && <p className="text-xs text-gray-600">{detail}</p>}
        {extra}
      </div>
    </section>
  );
}

/**
 * The interactive centerpiece of the Learn section: drag the seven gas
 * sliders (or apply a fault preset) and watch the real backend engines
 * re-diagnose the mix live across every Duval diagram.
 */
export function GasLabSection({ presetRequest }: GasLabSectionProps) {
  const [gases, setGases] = useState<SandboxGasInput>(FAULT_PRESETS[0].gases);
  const [activePresetId, setActivePresetId] = useState<string | null>(FAULT_PRESETS[0].id);
  const [result, setResult] = useState<SandboxRunResponse | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  // Debounced live run: every change re-diagnoses after a short pause, and
  // stale responses are dropped so fast dragging can't reorder results.
  useEffect(() => {
    const seq = ++requestSeq.current;
    setPending(true);
    const timer = setTimeout(() => {
      runSandboxApi(gases)
        .then((res) => {
          if (requestSeq.current !== seq) return;
          setResult(res);
          setError(null);
          setPending(false);
        })
        .catch((err: unknown) => {
          if (requestSeq.current !== seq) return;
          setError(err instanceof Error ? err.message : 'Sandbox request failed');
          setPending(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [gases]);

  // Applied when another section (e.g. the anatomy view) asks to demo a preset.
  useEffect(() => {
    if (!presetRequest) return;
    const preset = getPreset(presetRequest.presetId);
    if (!preset) return;
    setGases(preset.gases);
    setActivePresetId(preset.id);
  }, [presetRequest]);

  const applyPreset = (presetId: string) => {
    const preset = getPreset(presetId);
    if (!preset) return;
    setGases(preset.gases);
    setActivePresetId(preset.id);
  };

  const setGas = (key: keyof SandboxGasInput, value: number) => {
    setGases((prev) => ({ ...prev, [key]: value }));
    setActivePresetId(null);
  };

  const activePreset = activePresetId ? getPreset(activePresetId) : undefined;
  const triangle1Warnings = result?.duvalTriangle.triangle1.warnings ?? [];

  return (
    <div className="anim-rise lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* ——— Controls ——— */}
      <div className="space-y-4 lg:sticky lg:top-6">
        <div className="border border-gray-300 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Mix your own gas sample</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Drag the sliders — or load a fault preset — and the real diagnostic engines
            re-analyse the mix live. Watch the marker move across the Duval maps as the
            chemistry changes.
          </p>
        </div>

        <div className="border border-gray-300 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Fault presets
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {FAULT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`border px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
                  preset.id === activePresetId
                    ? 'border-gray-800 bg-gray-900 font-medium text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {activePreset && (
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              <span className="font-medium text-gray-800">{activePreset.label}:</span>{' '}
              {activePreset.description}
            </p>
          )}
        </div>

        <div className="border border-gray-300 bg-white px-4 py-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Gas concentrations
            </p>
            <span
              className={`text-[11px] ${pending ? 'text-status-pending' : 'text-transparent'}`}
              aria-hidden={!pending}
            >
              analysing…
            </span>
          </div>
          <div className="mt-2 space-y-3">
            {GAS_SLIDERS.map((gas) => (
              <div key={gas.key}>
                <div className="flex items-baseline justify-between">
                  <label htmlFor={`gaslab-${gas.key}`} className="text-xs font-medium text-gray-700">
                    {gas.label}
                  </label>
                  <span className="font-mono text-xs tabular-nums text-gray-800">
                    {gases[gas.key]} ppm
                  </span>
                </div>
                <input
                  id={`gaslab-${gas.key}`}
                  type="range"
                  min={0}
                  max={gas.max}
                  step={gas.step}
                  value={gases[gas.key]}
                  onChange={(e) => setGas(gas.key, Number(e.target.value))}
                  className="mt-1 w-full accent-accent"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ——— Live results ——— */}
      <div className="mt-6 space-y-4 lg:mt-0">
        {error && (
          <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error} — is the backend running? (<code className="font-mono text-xs">npm run dev:backend</code>)
          </div>
        )}

        {triangle1Warnings.length > 0 && (
          <div className="border border-amber-300 bg-amber-50 px-4 py-2.5">
            {triangle1Warnings.map(
              (warning) =>
                TRIANGLE_WARNING_NOTES[warning] && (
                  <p key={warning} className="text-xs leading-relaxed text-amber-800">
                    {TRIANGLE_WARNING_NOTES[warning]}
                  </p>
                ),
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <VerdictCard
            title="Key Gas Method"
            subtitle="Which single gas dominates?"
            verdict={result ? KEY_GAS_LABELS[result.keyGas.diagnosis] : '—'}
            detail={result?.keyGas.reasoning[0] ?? null}
            extra={
              result && (
                <p className="mt-1.5 text-[11px] uppercase tracking-wide text-gray-500">
                  Confidence: <span className="font-semibold text-gray-700">{result.keyGas.confidence}</span>
                </p>
              )
            }
          />
          <VerdictCard
            title="Doernenburg Ratios"
            subtitle="What do the gas-to-gas ratios say?"
            verdict={result ? DOERNENBURG_LABELS[result.doernenburg.diagnosis] : '—'}
            detail={result?.doernenburg.reasoning.at(-1) ?? null}
            extra={
              result && (
                <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                  {(
                    [
                      ['R1 CH₄/H₂', result.doernenburg.ratios.r1],
                      ['R2 C₂H₂/C₂H₄', result.doernenburg.ratios.r2],
                      ['R3 C₂H₂/CH₄', result.doernenburg.ratios.r3],
                      ['R4 C₂H₆/C₂H₂', result.doernenburg.ratios.r4],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-baseline gap-1">
                      <dt className="text-[11px] text-gray-500">{label}</dt>
                      <dd className="font-mono text-xs tabular-nums text-gray-800">
                        {value == null ? '—' : value.toFixed(2)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DuvalTriangle1 result={result?.duvalTriangle.triangle1 ?? null} />
          <DuvalPentagon1 result={result?.duvalPentagon1 ?? null} />
          <DuvalTriangle4 result={result?.duvalTriangle.triangle4 ?? null} />
          <DuvalTriangle5 result={result?.duvalTriangle.triangle5 ?? null} />
          <DuvalPentagon2 result={result?.duvalPentagon2 ?? null} />
          <div className="flex items-center border border-dashed border-gray-300 bg-gray-50 px-5 py-4">
            <p className="text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-800">Reading the maps:</span> the triangles
              and pentagons plot gas <em>proportions</em>, not amounts — so a marker always lands
              somewhere, even for a healthy transformer. In the full pipeline the Status engine
              decides whether gassing is abnormal at all; these maps then name the likely fault.
              Triangles 4 and 5 only activate when Triangle 1 lands in PD, T1, or T2 — that is
              their routing rule, not a missing result.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
