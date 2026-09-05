import type { RecommendationTier } from '@/types';

const tierStyles: Record<RecommendationTier, string> = {
  ROUTINE: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  MONITOR: 'border-sky-300 bg-sky-50 text-sky-800',
  INVESTIGATE: 'border-amber-300 bg-amber-50 text-amber-800',
  URGENT: 'border-red-300 bg-red-50 text-red-800',
  EXTREME: 'border-red-800 bg-red-800 text-white',
};

interface TierBadgeProps {
  tier: RecommendationTier;
  size?: 'sm' | 'lg';
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  return (
    <span
      className={`inline-block border font-mono font-bold tracking-wide ${tierStyles[tier]} ${
        size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {tier}
    </span>
  );
}

/** Small labelled chip used to flag gases (exceeded / dominant / max delta / max rate). */
const flagStyles = {
  exceeded: 'border-red-300 bg-red-50 text-red-800',
  dominant: 'border-sky-300 bg-sky-50 text-sky-800',
  maxDelta: 'border-amber-300 bg-amber-50 text-amber-800',
  maxRate: 'border-violet-300 bg-violet-50 text-violet-800',
} as const;

export type GasFlag = keyof typeof flagStyles;

export const GAS_FLAG_LABELS: Record<GasFlag, string> = {
  exceeded: 'LIMIT EXCEEDED',
  dominant: 'KEY GAS',
  maxDelta: 'MAX Δ',
  maxRate: 'MAX RATE',
};

export function GasFlagChip({ flag }: { flag: GasFlag }) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-1.5 py-px text-[10px] font-bold tracking-wide ${flagStyles[flag]}`}
    >
      {GAS_FLAG_LABELS[flag]}
    </span>
  );
}
