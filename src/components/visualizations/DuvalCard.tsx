import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface DuvalCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Backend-diagnosed zone code; null/undefined renders a pending state. */
  result?: string | null;
  interpretation?: string | null;
  metrics?: { label: string; value: string }[];
}

function ResultBadge({ result }: { result?: string | null }) {
  const pending = result == null;
  return (
    <span
      className={`inline-block whitespace-nowrap px-2.5 py-0.5 font-mono text-sm font-bold tabular-nums ${
        pending
          ? 'border border-gray-300 text-status-pending'
          : 'border border-red-800 bg-red-50 text-red-900'
      }`}
    >
      {pending ? '—' : result}
    </span>
  );
}

function CardFooter({
  result,
  interpretation,
  metrics,
}: Pick<DuvalCardProps, 'result' | 'interpretation' | 'metrics'>) {
  const pending = result == null;
  return (
    <footer className="px-4 pb-3 pt-2">
      {metrics && metrics.length > 0 && (
        <dl className="mb-1.5 flex flex-wrap gap-x-4 gap-y-0.5 border-t border-gray-200 pt-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-baseline gap-1.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{m.label}</dt>
              <dd className="font-mono text-xs tabular-nums text-gray-800">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className={`text-xs ${pending ? 'italic text-status-pending' : 'text-gray-600'}`}>
        {pending
          ? 'Not applicable for this sample — routing conditions not met.'
          : interpretation ?? 'Zone diagnosed by the backend analysis pipeline.'}
      </p>
    </footer>
  );
}

/**
 * Card frame shared by the Duval triangle/pentagon diagrams. The zone verdict
 * is the headline element — everything shown here is rendered verbatim from
 * the backend result; no diagnosis is computed on the frontend.
 *
 * Every card can be expanded into a full-size modal view of the same diagram
 * (same children, so tooltips and zone hover behave identically).
 */
export function DuvalCard({ title, subtitle, children, result, interpretation, metrics }: DuvalCardProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  return (
    <>
      <section className="flex flex-col border border-gray-300 bg-white shadow-[0_1px_2px_rgba(28,39,51,0.05)] transition-shadow duration-200 hover:shadow-[0_3px_12px_rgba(28,39,51,0.12)]">
        <header className="border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center gap-1.5">
              <ResultBadge result={result} />
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={`Expand ${title} diagram`}
                title="Expand diagram"
                className="no-print flex h-6 w-6 items-center justify-center self-center border border-gray-300 text-gray-500 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-800"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" />
                </svg>
              </button>
            </div>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </header>

        <div className="flex-1 px-4 pt-3">{children}</div>

        <CardFooter result={result} interpretation={interpretation} metrics={metrics} />
      </section>

      {expanded &&
        createPortal(
          <div
            className="no-print anim-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
            onClick={() => setExpanded(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${title} — expanded diagram`}
              className="anim-rise flex max-h-[94vh] w-[min(94vw,880px)] flex-col overflow-auto border border-gray-300 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.35)]"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="border-b border-gray-200 px-5 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                  <div className="flex items-center gap-2">
                    <ResultBadge result={result} />
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-label="Close expanded diagram"
                      title="Close (Esc)"
                      className="flex h-7 w-7 items-center justify-center self-center border border-gray-300 text-gray-500 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-800"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                      </svg>
                    </button>
                  </div>
                </div>
                {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
              </header>
              <div className="flex-1 px-6 pt-4">{children}</div>
              <CardFooter result={result} interpretation={interpretation} metrics={metrics} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
