import { useState } from 'react';
import { PIPELINE_STEPS } from '@/content/learn/pipelineSteps';

interface PipelineSectionProps {
  onOpenGasLab: () => void;
}

/**
 * The 10-engine pipeline as a vertical journey: each engine card slides in
 * with a staggered entrance and expands into a plain-English explanation.
 */
export function PipelineSection({ onOpenGasLab }: PipelineSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="anim-rise text-sm leading-relaxed text-gray-600">
        Every analysis run sends the sample through ten engines, strictly in this order —
        each one consumes the results of the ones before it. Click any step to see what it
        actually does.
      </p>

      <ol className="mt-6 border-l-2 border-gray-300 pl-0">
        {PIPELINE_STEPS.map((step, index) => {
          const expanded = expandedId === step.id;
          return (
            <li
              key={step.id}
              className="anim-rise relative pb-3 pl-8"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              {/* Node on the journey line */}
              <span
                aria-hidden
                className={`absolute -left-[13px] top-2.5 flex h-6 w-6 items-center justify-center border text-[11px] font-bold ${
                  expanded
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-400 bg-white text-gray-700'
                }`}
              >
                {step.step}
              </span>

              <div
                className={`border bg-white transition-colors duration-150 ${
                  expanded ? 'border-gray-800' : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : step.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left"
                >
                  <span>
                    <span className="text-sm font-semibold text-gray-900">{step.name}</span>
                    <span className="mt-0.5 block text-xs text-gray-600">{step.purpose}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-gray-400">{expanded ? '−' : '+'}</span>
                </button>

                {expanded && (
                  <div className="anim-rise border-t border-gray-200 px-4 py-3">
                    <p className="text-sm leading-relaxed text-gray-700">{step.detail}</p>
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold uppercase tracking-wide text-gray-500">Consumes</dt>
                        <dd className="mt-0.5 text-gray-700">{step.consumes}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-wide text-gray-500">Produces</dt>
                        <dd className="mt-0.5 text-gray-700">{step.produces}</dd>
                      </div>
                    </dl>
                    {step.inGasLab && (
                      <button
                        type="button"
                        onClick={onOpenGasLab}
                        className="mt-3 border border-gray-800 bg-gray-900 px-3 py-1 text-xs font-medium text-white transition-colors duration-150 hover:bg-gray-700"
                      >
                        Try this engine live in the Gas Lab →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p
        className="anim-rise border border-gray-300 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600"
        style={{ animationDelay: `${PIPELINE_STEPS.length * 55}ms` }}
      >
        <span className="font-semibold text-gray-800">Why so many methods?</span> No single DGA
        technique is reliable on its own — each has blind spots. The pipeline runs them all and
        presents the results side by side, so an engineer can see where the methods agree and
        where they disagree. Agreement builds confidence; disagreement is itself diagnostic
        information.
      </p>
    </div>
  );
}
