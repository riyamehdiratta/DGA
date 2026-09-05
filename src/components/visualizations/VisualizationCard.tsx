import type { ReactNode } from 'react';
import { PendingResultLabel } from './PendingResultLabel';

interface VisualizationCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  resultLabel?: string;
  result?: string | null;
  className?: string;
}

export function VisualizationCard({
  title,
  subtitle,
  children,
  resultLabel = 'Result',
  result,
  className = '',
}: VisualizationCardProps) {
  return (
    <section className={`border border-gray-300 bg-white shadow-[0_1px_2px_rgba(28,39,51,0.05)] ${className}`}>
      <header className="border-b border-gray-300 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </header>
      <div className="p-4">{children}</div>
      {/* Footer only renders when the caller has an assessment to show —
          charts without a backend-computed verdict simply have no footer. */}
      {result !== undefined && <PendingResultLabel label={resultLabel} result={result} />}
    </section>
  );
}
