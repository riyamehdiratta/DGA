import type { GasSampleInput, KeyGasResult } from './types.js';

/**
 * The gases KEY_GAS_RULES.md lists as a fault's *primary* gas: C2H4 (thermal
 * oil), CO (thermal cellulose), and H2 + C2H2 together (arcing; H2 alone maps
 * to partial discharge instead — see below). CH4, C2H6, and CO2 only ever
 * appear as secondary "typical pattern" members in the doc, never as a
 * primary/key gas for any diagnosis, so they cannot be the dominant gas.
 */
const KEY_GAS_CANDIDATES = ['h2', 'c2h4', 'co', 'c2h2'] as const;

type KeyGasCandidate = (typeof KEY_GAS_CANDIDATES)[number];

const GAS_DISPLAY_NAMES: Record<KeyGasCandidate, string> = {
  h2: 'H2',
  c2h4: 'C2H4',
  co: 'CO',
  c2h2: 'C2H2',
};

function inconclusive(reasoning: string[]): KeyGasResult {
  return { diagnosis: 'INCONCLUSIVE', dominantGas: null, confidence: 'LOW', reasoning };
}

/**
 * IEEE Key Gas Method (KEY_GAS_RULES.md).
 *
 * The doc describes fault patterns qualitatively ("predominantly X", "trace",
 * "minor quantities") rather than with literal numeric thresholds like the
 * Duval methods use. This implementation reads "dominant gas" as the single
 * highest-concentration gas among the four key-gas candidates above (a
 * magnitude comparison, not a gas-to-gas ratio — the doc's "never use gas
 * ratios" rule is honored: no value is ever divided by another).
 *
 * Distinguishing PARTIAL_DISCHARGE from ARCING when H2 dominates: PD's typical
 * pattern (small CH4, trace C2H4/C2H6) never mentions C2H2 at all, while
 * Arcing's pattern always involves C2H2 (as a primary gas in its own right, or
 * alongside H2). So H2-dominant with C2H2 present (>0) is read as the combined
 * H2/C2H2 arcing pattern; H2-dominant with no C2H2 at all is read as PD.
 */
export function runKeyGasEngine(sample: GasSampleInput): KeyGasResult {
  const candidateValues: Record<KeyGasCandidate, number> = {
    h2: sample.h2,
    c2h4: sample.c2h4,
    co: sample.co,
    c2h2: sample.c2h2,
  };

  const maxValue = Math.max(...KEY_GAS_CANDIDATES.map((gas) => candidateValues[gas]));

  if (maxValue <= 0) {
    return inconclusive([
      'No key gas (H2, C2H4, CO, C2H2) concentration is above zero — no dominant gas can be determined.',
    ]);
  }

  const topCandidates = KEY_GAS_CANDIDATES.filter((gas) => candidateValues[gas] === maxValue);

  if (topCandidates.length > 1) {
    return inconclusive([
      `Multiple key gases are tied for the highest concentration (${topCandidates
        .map((gas) => GAS_DISPLAY_NAMES[gas])
        .join(', ')} at ${maxValue} ppm) — no single dominant gas exists.`,
    ]);
  }

  const dominantGas = topCandidates[0];
  const otherCandidatesTotal = KEY_GAS_CANDIDATES.filter((gas) => gas !== dominantGas).reduce(
    (sum, gas) => sum + candidateValues[gas],
    0,
  );
  // Magnitude comparison against the combined total of the other candidates —
  // not a ratio between two individual gases.
  const clearlyDominant = candidateValues[dominantGas] >= otherCandidatesTotal;

  if (dominantGas === 'c2h4') {
    return {
      diagnosis: 'THERMAL_OIL',
      dominantGas,
      confidence: clearlyDominant ? 'HIGH' : 'MEDIUM',
      reasoning: [
        `C2H4 is the dominant key gas at ${candidateValues.c2h4} ppm, characteristic of a thermal fault in mineral oil.`,
      ],
    };
  }

  if (dominantGas === 'co') {
    return {
      diagnosis: 'THERMAL_CELLULOSE',
      dominantGas,
      confidence: clearlyDominant ? 'HIGH' : 'MEDIUM',
      reasoning: [
        `CO is the dominant key gas at ${candidateValues.co} ppm, characteristic of a thermal fault involving cellulose.`,
      ],
    };
  }

  if (dominantGas === 'c2h2') {
    return {
      diagnosis: 'ARCING',
      dominantGas,
      confidence: clearlyDominant ? 'HIGH' : 'MEDIUM',
      reasoning: [
        `C2H2 is the dominant key gas at ${candidateValues.c2h2} ppm, characteristic of a high energy electrical fault (arcing).`,
      ],
    };
  }

  // dominantGas === 'h2'
  if (candidateValues.c2h2 > 0) {
    return {
      diagnosis: 'ARCING',
      dominantGas,
      confidence: 'LOW',
      reasoning: [
        `H2 is the dominant key gas at ${candidateValues.h2} ppm, and C2H2 is also present (${candidateValues.c2h2} ppm) — the combined H2/C2H2 pattern is characteristic of arcing rather than partial discharge.`,
      ],
    };
  }

  return {
    diagnosis: 'PARTIAL_DISCHARGE',
    dominantGas,
    confidence: clearlyDominant ? 'HIGH' : 'MEDIUM',
    reasoning: [
      `H2 is the dominant key gas at ${candidateValues.h2} ppm with no C2H2 present, characteristic of a low energy electrical fault (partial discharge).`,
    ],
  };
}
