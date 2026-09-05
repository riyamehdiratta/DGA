import type {
  DuvalTriangle1Percentages,
  DuvalTriangle1Result,
  DuvalTriangle1Zone,
  DuvalTriangle4Percentages,
  DuvalTriangle4Result,
  DuvalTriangle4Zone,
  DuvalTriangle5Percentages,
  DuvalTriangle5Result,
  DuvalTriangle5Zone,
  DuvalTriangleEngineResult,
  GasSampleInput,
} from './types.js';

/**
 * Reliability heuristics from DUVAL_TRIANGLE_RULES.md's Edge Cases section.
 * The doc recommends flagging very-low-total-gas samples and near-boundary
 * results as lower confidence but does not specify exact numbers — these are
 * this implementation's documented choices, not IEEE-specified thresholds.
 */
const LOW_GAS_LEVEL_TOTAL_PPM = 10;
const NEAR_BOUNDARY_EPSILON_PCT = 0.3;

function isNearAnyBreakpoint(value: number, breakpoints: number[]): boolean {
  return breakpoints.some((bp) => Math.abs(value - bp) <= NEAR_BOUNDARY_EPSILON_PCT);
}

/**
 * Shared ternary percentage calculation (DUVAL_TRIANGLE_RULES.md §1), used by
 * all three triangles. Returns null when the input is invalid: negative gas
 * values (never silently coerced to zero) or a zero total (division by zero).
 */
function computeTernaryPercentages(
  gas1: number,
  gas2: number,
  gas3: number,
): [number, number, number] | null {
  if (gas1 < 0 || gas2 < 0 || gas3 < 0) {
    return null;
  }
  const sum = gas1 + gas2 + gas3;
  if (sum <= 0) {
    return null;
  }
  return [(100 * gas1) / sum, (100 * gas2) / sum, (100 * gas3) / sum];
}

function describeInvalidTernaryInput(gas1: number, gas2: number, gas3: number): string {
  if (gas1 < 0 || gas2 < 0 || gas3 < 0) {
    return 'One or more gas concentrations is negative — invalid input, cannot compute a Duval Triangle point.';
  }
  return 'All three relevant gas concentrations are zero — insufficient data to compute a Duval Triangle point.';
}

// ---------------------------------------------------------------------------
// Triangle 1 — Table 6 (§2.2). Gases: CH4, C2H4, C2H2. Check order: PD, T1,
// T2, T3, DT, D1, D2 — DT and D2 each have multiple OR'd alternative rows.
// ---------------------------------------------------------------------------

const TRIANGLE1_ZONE_DESCRIPTIONS: Record<DuvalTriangle1Zone, string> = {
  PD: 'Partial discharge',
  T1: 'Thermal fault < 300°C',
  T2: 'Thermal fault 300°C–700°C',
  T3: 'Thermal fault > 700°C',
  DT: 'Mix of electrical and thermal fault',
  D1: 'Low energy discharge',
  D2: 'High energy discharge / arcing',
};

function matchTriangle1Zone(
  pctCh4: number,
  pctC2h4: number,
  pctC2h2: number,
): DuvalTriangle1Zone | null {
  if (pctCh4 >= 98) {
    return 'PD';
  }
  if (pctCh4 < 98 && pctC2h4 < 20 && pctC2h2 < 4) {
    return 'T1';
  }
  if (pctC2h4 >= 20 && pctC2h4 < 50 && pctC2h2 < 4) {
    return 'T2';
  }
  if (pctC2h4 >= 50 && pctC2h2 < 15) {
    return 'T3';
  }
  if (pctC2h4 < 50 && pctC2h2 >= 4 && pctC2h2 < 13) {
    return 'DT';
  }
  if (pctC2h4 >= 40 && pctC2h4 < 50 && pctC2h2 >= 13 && pctC2h2 < 29) {
    return 'DT';
  }
  if (pctC2h4 >= 50 && pctC2h2 >= 15 && pctC2h2 < 29) {
    return 'DT';
  }
  if (pctC2h4 < 23 && pctC2h2 >= 13) {
    return 'D1';
  }
  if (pctC2h4 >= 23 && pctC2h2 >= 29) {
    return 'D2';
  }
  if (pctC2h4 >= 23 && pctC2h4 < 40 && pctC2h2 >= 13 && pctC2h2 < 29) {
    return 'D2';
  }
  return null;
}

export function runDuvalTriangle1(sample: GasSampleInput): DuvalTriangle1Result {
  const { ch4, c2h4, c2h2 } = sample;
  const pct = computeTernaryPercentages(ch4, c2h4, c2h2);

  if (pct == null) {
    return {
      zone: null,
      percentages: null,
      warnings: [],
      reasoning: [describeInvalidTernaryInput(ch4, c2h4, c2h2)],
    };
  }

  const [pctCh4, pctC2h4, pctC2h2] = pct;
  const percentages: DuvalTriangle1Percentages = { ch4: pctCh4, c2h4: pctC2h4, c2h2: pctC2h2 };

  const warnings: string[] = [];
  if (ch4 + c2h4 + c2h2 < LOW_GAS_LEVEL_TOTAL_PPM) {
    warnings.push('low_gas_levels');
  }
  if (
    isNearAnyBreakpoint(pctCh4, [98]) ||
    isNearAnyBreakpoint(pctC2h4, [20, 23, 40, 50]) ||
    isNearAnyBreakpoint(pctC2h2, [4, 13, 15, 29])
  ) {
    warnings.push('near_boundary');
  }

  const zone = matchTriangle1Zone(pctCh4, pctC2h4, pctC2h2);

  const reasoning: string[] = [
    `%CH4=${pctCh4.toFixed(2)}, %C2H4=${pctC2h4.toFixed(2)}, %C2H2=${pctC2h2.toFixed(2)}.`,
  ];
  reasoning.push(
    zone == null
      ? 'No Table 6 fault zone condition was satisfied — result is unclassified.'
      : `Matched Table 6 zone ${zone} (${TRIANGLE1_ZONE_DESCRIPTIONS[zone]}).`,
  );

  return { zone: zone ?? 'UNCLASSIFIED', percentages, warnings, reasoning };
}

// ---------------------------------------------------------------------------
// Triangle 4 — Table D.3 (§3.2). Gases: H2, CH4, C2H6. Check order: PD, S, O,
// C, ND. Refines PD/T1/T2 Triangle 1 results only.
// ---------------------------------------------------------------------------

const TRIANGLE4_ZONE_DESCRIPTIONS: Record<DuvalTriangle4Zone, string> = {
  PD: 'Partial discharge',
  S: 'Stray gassing of oil',
  O: 'Overheating < 250°C',
  C: 'Possible carbonization of paper',
  ND: 'Not determined',
};

function matchTriangle4Zone(
  pctH2: number,
  pctCh4: number,
  pctC2h6: number,
): DuvalTriangle4Zone | null {
  if (pctCh4 >= 2 && pctCh4 < 15 && pctC2h6 < 1) {
    return 'PD';
  }
  if (pctH2 >= 9 && pctC2h6 >= 30 && pctC2h6 < 46) {
    return 'S';
  }
  if (pctH2 >= 15 && pctC2h6 >= 24 && pctC2h6 < 30) {
    return 'S';
  }
  if (pctCh4 < 36 && pctC2h6 >= 1 && pctC2h6 < 24) {
    return 'S';
  }
  if (pctCh4 < 36 && pctCh4 >= 15 && pctC2h6 < 1) {
    return 'S';
  }
  if (pctCh4 < 2 && pctC2h6 < 1) {
    return 'S';
  }
  if (pctH2 < 9 && pctC2h6 >= 30) {
    return 'O';
  }
  if (pctCh4 >= 36 && pctC2h6 >= 24) {
    return 'C';
  }
  if (pctH2 < 15 && pctC2h6 >= 24 && pctC2h6 < 30) {
    return 'C';
  }
  if (pctH2 >= 9 && pctC2h6 >= 46) {
    return 'ND';
  }
  return null;
}

export function runDuvalTriangle4(sample: GasSampleInput): DuvalTriangle4Result {
  const { h2, ch4, c2h6 } = sample;
  const pct = computeTernaryPercentages(h2, ch4, c2h6);

  if (pct == null) {
    return {
      zone: null,
      percentages: null,
      warnings: [],
      reasoning: [describeInvalidTernaryInput(h2, ch4, c2h6)],
    };
  }

  const [pctH2, pctCh4, pctC2h6] = pct;
  const percentages: DuvalTriangle4Percentages = { h2: pctH2, ch4: pctCh4, c2h6: pctC2h6 };

  const warnings: string[] = [];
  if (h2 + ch4 + c2h6 < LOW_GAS_LEVEL_TOTAL_PPM) {
    warnings.push('low_gas_levels');
  }
  if (
    isNearAnyBreakpoint(pctH2, [9, 15]) ||
    isNearAnyBreakpoint(pctCh4, [2, 15, 36]) ||
    isNearAnyBreakpoint(pctC2h6, [1, 24, 30, 46])
  ) {
    warnings.push('near_boundary');
  }

  const zone = matchTriangle4Zone(pctH2, pctCh4, pctC2h6);

  const reasoning: string[] = [
    `%H2=${pctH2.toFixed(2)}, %CH4=${pctCh4.toFixed(2)}, %C2H6=${pctC2h6.toFixed(2)}.`,
  ];
  if (zone == null) {
    reasoning.push('No Table D.3 fault zone condition was satisfied — result is unclassified.');
  } else {
    reasoning.push(`Matched Table D.3 zone ${zone} (${TRIANGLE4_ZONE_DESCRIPTIONS[zone]}).`);
    if (zone === 'C') {
      reasoning.push(
        'Zone C indicates a possibility of paper carbonization, not certainty — further investigation with carbon oxides and furans analysis is recommended.',
      );
    }
  }

  return { zone: zone ?? 'UNCLASSIFIED', percentages, warnings, reasoning };
}

// ---------------------------------------------------------------------------
// Triangle 5 — Table D.4 (§4.2). Gases: CH4, C2H4, C2H6 (no row constrains
// %CH4). Check order: PD, O, S, T2, T3, C, ND. Refines T2/T3 Triangle 1
// results only.
// ---------------------------------------------------------------------------

const TRIANGLE5_ZONE_DESCRIPTIONS: Record<DuvalTriangle5Zone, string> = {
  PD: 'Partial discharge',
  O: 'Overheating < 250°C (oil only)',
  S: 'Stray gassing of oil',
  T2: 'Thermal fault 300°C–700°C (oil only)',
  T3: 'Thermal fault > 700°C (oil only)',
  C: 'Possible carbonization of paper',
  ND: 'Not determined',
};

function matchTriangle5Zone(pctC2h4: number, pctC2h6: number): DuvalTriangle5Zone | null {
  if (pctC2h4 < 1 && pctC2h6 >= 2 && pctC2h6 < 14) {
    return 'PD';
  }
  if (pctC2h4 >= 1 && pctC2h4 < 10 && pctC2h6 >= 2 && pctC2h6 < 14) {
    return 'O';
  }
  if (pctC2h4 < 1 && pctC2h6 < 2) {
    return 'O';
  }
  if (pctC2h4 < 10 && pctC2h6 >= 54) {
    return 'O';
  }
  if (pctC2h4 < 10 && pctC2h6 >= 14 && pctC2h6 < 54) {
    return 'S';
  }
  if (pctC2h4 >= 10 && pctC2h4 < 35 && pctC2h6 < 12) {
    return 'T2';
  }
  if (pctC2h4 >= 35 && pctC2h6 < 12) {
    return 'T3';
  }
  if (pctC2h4 >= 50 && pctC2h6 >= 12 && pctC2h6 < 14) {
    return 'T3';
  }
  if (pctC2h4 >= 70 && pctC2h6 >= 14) {
    return 'T3';
  }
  if (pctC2h4 >= 35 && pctC2h6 >= 30) {
    return 'T3';
  }
  if (pctC2h4 >= 10 && pctC2h4 < 50 && pctC2h6 >= 12 && pctC2h6 < 14) {
    return 'C';
  }
  if (pctC2h4 >= 10 && pctC2h4 < 70 && pctC2h6 >= 14 && pctC2h6 < 30) {
    return 'C';
  }
  if (pctC2h4 >= 10 && pctC2h4 < 35 && pctC2h6 >= 30) {
    return 'ND';
  }
  return null;
}

export function runDuvalTriangle5(sample: GasSampleInput): DuvalTriangle5Result {
  const { ch4, c2h4, c2h6 } = sample;
  const pct = computeTernaryPercentages(ch4, c2h4, c2h6);

  if (pct == null) {
    return {
      zone: null,
      percentages: null,
      warnings: [],
      reasoning: [describeInvalidTernaryInput(ch4, c2h4, c2h6)],
    };
  }

  const [pctCh4, pctC2h4, pctC2h6] = pct;
  const percentages: DuvalTriangle5Percentages = { ch4: pctCh4, c2h4: pctC2h4, c2h6: pctC2h6 };

  const warnings: string[] = [];
  if (ch4 + c2h4 + c2h6 < LOW_GAS_LEVEL_TOTAL_PPM) {
    warnings.push('low_gas_levels');
  }
  if (isNearAnyBreakpoint(pctC2h4, [1, 10, 35, 50, 70]) || isNearAnyBreakpoint(pctC2h6, [2, 12, 14, 30, 54])) {
    warnings.push('near_boundary');
  }

  const zone = matchTriangle5Zone(pctC2h4, pctC2h6);

  const reasoning: string[] = [
    `%CH4=${pctCh4.toFixed(2)}, %C2H4=${pctC2h4.toFixed(2)}, %C2H6=${pctC2h6.toFixed(2)}.`,
  ];
  if (zone == null) {
    reasoning.push('No Table D.4 fault zone condition was satisfied — result is unclassified.');
  } else {
    reasoning.push(`Matched Table D.4 zone ${zone} (${TRIANGLE5_ZONE_DESCRIPTIONS[zone]}).`);
    if (zone === 'C') {
      reasoning.push(
        'Zone C indicates a possibility of paper carbonization, not certainty — further investigation with carbon oxides and furans analysis is recommended.',
      );
    }
  }

  return { zone: zone ?? 'UNCLASSIFIED', percentages, warnings, reasoning };
}

// ---------------------------------------------------------------------------
// Orchestrator — routing rules (§6): Triangle 1 always runs. Triangle 4 runs
// only when Triangle 1 result is PD/T1/T2. Triangle 5 runs only when Triangle
// 1 result is T2/T3 (T2 qualifies for both — they are not mutually
// exclusive). D1/D2/DT never trigger either refinement.
// ---------------------------------------------------------------------------

export function runDuvalTriangleEngine(sample: GasSampleInput): DuvalTriangleEngineResult {
  const triangle1 = runDuvalTriangle1(sample);

  const eligibleForTriangle4 =
    triangle1.zone === 'PD' || triangle1.zone === 'T1' || triangle1.zone === 'T2';
  const eligibleForTriangle5 = triangle1.zone === 'T2' || triangle1.zone === 'T3';

  return {
    triangle1,
    triangle4: eligibleForTriangle4 ? runDuvalTriangle4(sample) : null,
    triangle5: eligibleForTriangle5 ? runDuvalTriangle5(sample) : null,
  };
}
