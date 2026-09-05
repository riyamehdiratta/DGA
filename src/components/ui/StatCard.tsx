import { formatDgaStatus } from '@/lib/analysis';
import type { DgaStatus } from '@/types';

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="border border-gray-300 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
        {value}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>
      )}
    </div>
  );
}

const statusStyles: Record<DgaStatus | 'Pending', string> = {
  STATUS_1: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  STATUS_2: 'text-amber-700 bg-amber-50 border-amber-200',
  STATUS_3: 'text-red-800 bg-red-50 border-red-200',
  Pending: 'text-gray-600 bg-gray-50 border-gray-200',
};

interface StatusBadgeProps {
  status: DgaStatus | 'Pending';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {formatDgaStatus(status)}
    </span>
  );
}
