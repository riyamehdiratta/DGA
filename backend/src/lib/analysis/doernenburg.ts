import type { DoernenburgResult, DoernenburgRatios, GasSampleInput } from './types.js';

/** Division Rules: a zero denominator yields null, never throws or produces NaN/Infinity. */
function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function formatRatio(value: number | null): string {
  return value == null ? 'null (denominator is zero)' : value.toFixed(4);
}

/**
 * IEEE Doernenburg Ratio Method (DOERNENBURG_RATIO_RULES.md).
 *
 * Four ratios (R1=CH4/H2, R2=C2H2/C2H4, R3=C2H2/CH4, R4=C2H6/C2H2) are compared
 * against fixed numeric bounds for three fault types. CORONA's doc entry marks
 * R2 as "not significant" rather than giving it a numeric bound — unlike
 * THERMAL_DECOMPOSITION and ARCING, which require all four ratios, CORONA's
 * required conditions are only R1, R3, and R4; R2 never gates a CORONA match
 * (including when R2 is null).
 */
export function runDoernenburgEngine(sample: GasSampleInput): DoernenburgResult {
  const r1 = safeDivide(sample.ch4, sample.h2);
  const r2 = safeDivide(sample.c2h2, sample.c2h4);
  const r3 = safeDivide(sample.c2h2, sample.ch4);
  const r4 = safeDivide(sample.c2h6, sample.c2h2);

  const ratios: DoernenburgRatios = { r1, r2, r3, r4 };

  const reasoning: string[] = [
    `R1 (CH4/H2) = ${formatRatio(r1)}`,
    `R2 (C2H2/C2H4) = ${formatRatio(r2)}`,
    `R3 (C2H2/CH4) = ${formatRatio(r3)}`,
    `R4 (C2H6/C2H2) = ${formatRatio(r4)}`,
  ];

  const isThermalDecomposition =
    r1 != null &&
    r1 > 1.0 &&
    r2 != null &&
    r2 < 0.75 &&
    r3 != null &&
    r3 < 0.3 &&
    r4 != null &&
    r4 > 0.4;

  if (isThermalDecomposition) {
    return {
      diagnosis: 'THERMAL_DECOMPOSITION',
      ratios,
      reasoning: [
        ...reasoning,
        'R1 > 1.0, R2 < 0.75, R3 < 0.3, and R4 > 0.4 — matches thermal decomposition.',
      ],
    };
  }

  const isCorona = r1 != null && r1 < 0.1 && r3 != null && r3 < 0.3 && r4 != null && r4 > 0.4;

  if (isCorona) {
    return {
      diagnosis: 'CORONA',
      ratios,
      reasoning: [
        ...reasoning,
        'R1 < 0.1, R3 < 0.3, and R4 > 0.4 (R2 not significant) — matches corona (low intensity partial discharge).',
      ],
    };
  }

  const isArcing =
    r1 != null &&
    r1 > 0.1 &&
    r1 < 1.0 &&
    r2 != null &&
    r2 > 0.75 &&
    r3 != null &&
    r3 > 0.3 &&
    r4 != null &&
    r4 < 0.4;

  if (isArcing) {
    return {
      diagnosis: 'ARCING',
      ratios,
      reasoning: [
        ...reasoning,
        '0.1 < R1 < 1.0, R2 > 0.75, R3 > 0.3, and R4 < 0.4 — matches arcing (high intensity partial discharge).',
      ],
    };
  }

  return {
    diagnosis: 'INCONCLUSIVE',
    ratios,
    reasoning: [...reasoning, 'No Doernenburg fault classification conditions were fully satisfied.'],
  };
}
