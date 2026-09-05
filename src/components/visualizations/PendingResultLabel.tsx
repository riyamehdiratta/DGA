import { PENDING_ANALYSIS } from './types';

interface PendingResultLabelProps {
  label?: string;
  result?: string | null;
}

export function PendingResultLabel({ label = 'Result', result }: PendingResultLabelProps) {
  const displayValue = result ?? PENDING_ANALYSIS;
  const isPending = displayValue === PENDING_ANALYSIS;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          isPending ? 'text-status-pending italic' : 'text-gray-900'
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
}
