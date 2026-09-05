import type {
  RecommendationEngineInput,
  RecommendationResult,
  RecommendationTier,
} from './types.js';

/**
 * Duval fault-zone codes that carry a lower-urgency signal per 6.1.2.2.
 * Applies uniformly across Triangle 1/4/5 and Pentagon 1/2 zone vocabularies.
 */
const DE_ESCALATE_ZONES = new Set(['PD', 'T1', 'S']);

/**
 * Duval fault-zone codes that indicate high-energy arcing, high-temperature
 * thermal fault, or possible paper involvement, per 5.3.2.
 */
const ESCALATE_ZONES = new Set(['D2', 'T3', 'T3-H', 'C']);

const EXTREME_C2H4_DELTA_PPM = 200;
const EXTREME_C2H6_LEVEL_PPM = 1000;

const MANDATORY_CAVEAT =
  'This recommendation is decision support only — it does not replace expert judgment, consultation with the transformer manufacturer, or company-specific DGA policy.';

const ACTIONS_BY_TIER: Record<RecommendationTier, string[]> = {
  ROUTINE: ['Continue routine operation.', "Sample per the owner's normal DGA screening protocol."],
  MONITOR: [
    'Treat as a lower-urgency issue; continue monitoring.',
    'Note that a low-temperature fault (T1) may still affect long-term insulation life.',
  ],
  INVESTIGATE: [
    'Investigate the probable cause of gas generation.',
    'Increase sampling frequency.',
    'Consider on-line dissolved gas monitoring.',
    'Establish multi-point generation rates if not already available.',
  ],
  URGENT: [
    'Place the transformer under increased surveillance.',
    'Recommend additional transformer testing.',
    'Consult the transformer manufacturer or a DGA expert.',
  ],
  EXTREME: [
    'Recommend immediate investigation, including additional oil analysis and physical/electrical testing.',
    'Consider operating restrictions until the cause is dismissed as sampling error or fully understood.',
  ],
};

function collectDuvalZones(input: RecommendationEngineInput): string[] {
  const candidates = [
    input.duvalTriangle1Zone,
    input.duvalTriangle4Zone,
    input.duvalTriangle5Zone,
    input.duvalPentagon1Diagnosis,
    input.duvalPentagon2Diagnosis,
  ];
  const zones: string[] = [];
  for (const zone of candidates) {
    if (zone != null && zone !== 'UNCLASSIFIED' && zone !== 'OUTSIDE') {
      zones.push(zone);
    }
  }
  return zones;
}

/**
 * DGA Recommendations Engine (DGA_RECOMMENDATIONS.md).
 *
 * Computes a severity tier and recommended actions from results already
 * produced upstream (Status + the Duval-family fault-zone results) — it
 * never performs a new diagnosis. Runs last in the pipeline.
 *
 * Step 1: base tier from Status.
 * Step 2 (STATUS_2 only): de-escalate to MONITOR on PD/T1/S, escalate to
 *   URGENT on D2/T3/T3-H/C — escalation wins on conflict.
 * Step 3 (always): extreme override to EXTREME on C2H4 delta > 200 ppm or
 *   C2H6 level > 1000 ppm, regardless of Status or the tier so far.
 */
export function runRecommendationEngine(input: RecommendationEngineInput): RecommendationResult {
  const reasoning: string[] = [];
  let tier: RecommendationTier;

  switch (input.status) {
    case 'STATUS_1':
      tier = 'ROUTINE';
      reasoning.push('Base tier ROUTINE from STATUS_1.');
      break;
    case 'STATUS_2':
      tier = 'INVESTIGATE';
      reasoning.push('Base tier INVESTIGATE from STATUS_2.');
      break;
    case 'STATUS_3':
      tier = 'URGENT';
      reasoning.push('Base tier URGENT from STATUS_3.');
      break;
  }

  if (input.status === 'STATUS_2') {
    const zones = collectDuvalZones(input);
    const escalating = zones.filter((zone) => ESCALATE_ZONES.has(zone));
    const deescalating = zones.filter((zone) => DE_ESCALATE_ZONES.has(zone));

    if (escalating.length > 0) {
      tier = 'URGENT';
      reasoning.push(
        `Escalated to URGENT: fault-zone result(s) ${escalating.join(', ')} indicate high-energy arcing, a high-temperature thermal fault, or possible paper involvement.`,
      );
    } else if (deescalating.length > 0) {
      tier = 'MONITOR';
      reasoning.push(
        `De-escalated to MONITOR: fault-zone result(s) ${deescalating.join(', ')} indicate a lower-urgency issue (partial discharge, low-temperature fault, or stray gassing).`,
      );
    }
  }

  const extremeReasons: string[] = [];
  if (input.c2h4Delta != null && input.c2h4Delta > EXTREME_C2H4_DELTA_PPM) {
    extremeReasons.push(
      `C2H4 delta (${input.c2h4Delta} ppm) exceeds the extreme threshold of ${EXTREME_C2H4_DELTA_PPM} ppm`,
    );
  }
  if (input.c2h6Level > EXTREME_C2H6_LEVEL_PPM) {
    extremeReasons.push(
      `C2H6 level (${input.c2h6Level} ppm) exceeds the extreme threshold of ${EXTREME_C2H6_LEVEL_PPM} ppm`,
    );
  }
  if (extremeReasons.length > 0) {
    tier = 'EXTREME';
    reasoning.push(`Escalated to EXTREME: ${extremeReasons.join('; ')}.`);
  }

  reasoning.push(MANDATORY_CAVEAT);

  return {
    tier,
    actions: ACTIONS_BY_TIER[tier],
    reasoning,
  };
}
