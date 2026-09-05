import type { RecommendationTier } from '@/types';

export interface SeverityTierInfo {
  tier: RecommendationTier;
  label: string;
  /** How the pipeline arrives at this tier (docs/DGA_RECOMMENDATIONS.md). */
  trigger: string;
  /** The literal IEEE-derived action set for the tier. */
  actions: string[];
  /** Tailwind classes for the ladder rung. */
  accentClasses: string;
}

/**
 * The five severity tiers in increasing order, with the exact action sets
 * from docs/DGA_RECOMMENDATIONS.md — never invent additional actions.
 */
export const SEVERITY_TIERS: SeverityTierInfo[] = [
  {
    tier: 'ROUTINE',
    label: 'Routine',
    trigger: 'Status 1 — all gases and deltas within normal limits.',
    actions: [
      'Continue routine operation.',
      "Sample per the owner's normal DGA screening protocol.",
    ],
    accentClasses: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    tier: 'MONITOR',
    label: 'Monitor',
    trigger:
      'Status 2 softened because the fault diagnosis is mild: partial discharge (PD), low-temperature fault (T1), or stray gassing (S).',
    actions: [
      'Treat as a lower-urgency issue.',
      'Continue monitoring; note that a low-temperature fault (T1) may still affect long-term insulation life.',
    ],
    accentClasses: 'border-lime-300 bg-lime-50 text-lime-800',
  },
  {
    tier: 'INVESTIGATE',
    label: 'Investigate',
    trigger: 'Status 2 with no softening or hardening fault-zone signal.',
    actions: [
      'Investigate the probable cause of gas generation.',
      'Increase sampling frequency.',
      'Consider on-line dissolved gas monitoring.',
      'Establish multi-point generation rates if not already available.',
    ],
    accentClasses: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  {
    tier: 'URGENT',
    label: 'Urgent',
    trigger:
      'Status 3, or Status 2 hardened because the diagnosis is severe: high-energy arcing (D2), high-temperature thermal fault (T3/T3-H), or paper involvement (C). When mild and severe signals disagree, severe wins.',
    actions: [
      'Place the transformer under increased surveillance.',
      'Recommend additional transformer testing.',
      'Consult the transformer manufacturer or a DGA expert.',
    ],
    accentClasses: 'border-orange-300 bg-orange-50 text-orange-800',
  },
  {
    tier: 'EXTREME',
    label: 'Extreme',
    trigger:
      'Overrides everything else when C2H4 rose by more than 200 ppm since the last sample, or C2H6 exceeds 1000 ppm.',
    actions: [
      'Recommend immediate investigation, including additional oil analysis and physical/electrical testing.',
      'Consider operating restrictions until the cause is dismissed as sampling error or fully understood.',
    ],
    accentClasses: 'border-red-300 bg-red-50 text-red-900',
  },
];

/**
 * IEEE C57.104-2019 Clause 5.3 — the mandatory caveat every recommendation
 * carries (docs/DGA_RECOMMENDATIONS.md).
 */
export const EXPERT_JUDGMENT_CAVEAT =
  'Because of the potentially serious consequences and high cost of misinterpreting transformer test data, an inflexible interpretation, based on an exclusively mechanical scoring approach, without the application of expert judgment, is highly inadvisable.';

export interface StatusInfo {
  status: 'STATUS_1' | 'STATUS_2' | 'STATUS_3';
  meaning: string;
  rule: string;
}

/** Plain-English status definitions (docs/IEEE_STATUS_LOGIC.md). */
export const STATUS_MEANINGS: StatusInfo[] = [
  {
    status: 'STATUS_1',
    meaning: 'Normal — carry on.',
    rule: 'Every gas is at or below its Table 1 limit AND every change since the last sample is within Table 3.',
  },
  {
    status: 'STATUS_2',
    meaning: 'Elevated — watch it.',
    rule: 'Neither fully normal (Status 1 failed) nor beyond the alarm limits (Status 3 not triggered).',
  },
  {
    status: 'STATUS_3',
    meaning: 'High — act.',
    rule: 'Some gas exceeds its Table 2 limit OR is being generated faster than IEEE Table 4 allows.',
  },
];
