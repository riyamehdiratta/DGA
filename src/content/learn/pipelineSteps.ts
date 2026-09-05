export interface PipelineStep {
  id: string;
  /** 1-based position in the pipeline. */
  step: number;
  name: string;
  /** One-line purpose shown on the collapsed card. */
  purpose: string;
  consumes: string;
  produces: string;
  /** Plain-English explanation shown when the card is expanded. */
  detail: string;
  /** True for the gas-only engines that can be tried live in the Gas Lab. */
  inGasLab?: boolean;
}

/** The 10-engine pipeline, in execution order (docs/ANALYSIS_PIPELINE.md). */
export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'norm-profile',
    step: 1,
    name: 'Norm Profile',
    purpose: 'Picks which set of IEEE threshold tables applies to this transformer.',
    consumes: 'O2 and N2 concentrations',
    produces: 'A norm profile: Low Ratio, High Ratio, or Default High Ratio',
    detail:
      'The oxygen-to-nitrogen ratio tells us how the transformer is sealed and breathed. IEEE C57.104 publishes different “normal” gas limits for low-O2/N2 and high-O2/N2 units, so before anything else the pipeline decides which column of every subsequent table to read. If O2/N2 was not measured, the more conservative high-ratio limits are used by default.',
  },
  {
    id: 'delta',
    step: 2,
    name: 'Delta',
    purpose: 'Measures how much each gas changed since the previous sample.',
    consumes: 'Current sample + most recent previous sample',
    produces: 'Per-gas change (Δ ppm) for all seven gases',
    detail:
      'A gas level that is stable for years means something very different from the same level reached in a month. The Delta engine subtracts the previous sample from the current one, gas by gas, so later engines can react to sudden jumps and not just absolute values.',
  },
  {
    id: 'rate',
    step: 3,
    name: 'Rate',
    purpose: 'Computes how fast each gas is being generated, in ppm per year.',
    consumes: 'Up to 6 recent samples + the current one',
    produces: 'Annualized generation rate per gas, checked against IEEE Table 4',
    detail:
      'Using a best-fit line through the recent sample history, the Rate engine estimates each gas’s annual generation rate. IEEE Table 4 defines how much per-year growth is acceptable; anything faster is flagged and feeds directly into the Status decision.',
  },
  {
    id: 'status',
    step: 4,
    name: 'Status',
    purpose: 'Assigns the transformer’s overall DGA condition: Status 1, 2, or 3.',
    consumes: 'Current gases, Delta, Rate, Norm Profile, transformer age',
    produces: 'STATUS_1 (normal), STATUS_2 (elevated), or STATUS_3 (high)',
    detail:
      'Status 1 means every gas is at or below its Table 1 limit and every recent change is within Table 3 — business as usual. Status 3 means some gas exceeds its Table 2 limit or is being generated faster than Table 4 allows — a clear signal to act. Status 2 is everything in between: elevated, worth watching, not yet alarming. This is the single most important output for deciding what to do next.',
  },
  {
    id: 'key-gas',
    step: 5,
    name: 'Key Gas',
    purpose: 'A first, rough guess at the fault type from the single dominant gas.',
    consumes: 'Current gas concentrations only',
    produces: 'Thermal (oil), Thermal (cellulose), Partial Discharge, Arcing, or Inconclusive',
    detail:
      'Each fault family tends to produce one characteristic “key” gas: ethylene for overheated oil, carbon monoxide for overheated paper, hydrogen for partial discharge, acetylene for arcing. This method just looks at which key gas dominates. It is deliberately simple — IEEE notes it gets roughly half of cases wrong when automated — so it is only ever a starting hint, never the final word.',
    inGasLab: true,
  },
  {
    id: 'doernenburg',
    step: 6,
    name: 'Doernenburg Ratios',
    purpose: 'Classifies the fault using four gas-to-gas ratios.',
    consumes: 'Current gas concentrations only',
    produces: 'Thermal Decomposition, Corona, Arcing, or Inconclusive',
    detail:
      'Instead of raw levels, this method compares gases to each other: R1 = CH4/H2, R2 = C2H2/C2H4, R3 = C2H2/CH4, R4 = C2H6/C2H2. Each fault type has a fingerprint pattern of ratio values. Ratios cancel out “how much gas” and isolate “what kind of chemistry,” making this more robust than Key Gas — but it answers Inconclusive whenever the pattern is not clean.',
    inGasLab: true,
  },
  {
    id: 'duval-triangle',
    step: 7,
    name: 'Duval Triangle',
    purpose: 'Plots the sample inside a triangle whose regions are fault types.',
    consumes: 'CH4, C2H4, C2H2 (Triangle 1); H2/C2H6 variants for Triangles 4–5',
    produces: 'A fault zone: PD, T1, T2, T3, DT, D1, or D2 (+ refinements)',
    detail:
      'The three gases are converted to percentages of their sum, which pins a single point inside a triangle. IEEE divides that triangle into labelled regions — thermal faults of increasing temperature (T1→T3), discharges of increasing energy (D1→D2), and mixtures (DT). If Triangle 1 lands in a low-temperature or PD zone, Triangles 4 and 5 re-plot the point with different gases to separate look-alikes such as stray gassing. Because it uses proportions, not amounts, it always names a zone — even for a healthy transformer — so it must only be interpreted after Status says gassing is actually abnormal.',
    inGasLab: true,
  },
  {
    id: 'duval-pentagon-1',
    step: 8,
    name: 'Duval Pentagon 1',
    purpose: 'Places all five hydrocarbon gases on one five-axis map.',
    consumes: 'H2, CH4, C2H6, C2H4, C2H2',
    produces: 'A fault zone: PD, D1, D2, T1, T2, T3, or S',
    detail:
      'Five axes radiate from the centre, one per gas, 72° apart. The sample’s gas percentages become a five-cornered shape, and its centroid — its balance point — lands in one of seven labelled regions. Using all five gases at once, it catches patterns the three-gas triangle can miss, including stray gassing (S) as a first-class zone.',
    inGasLab: true,
  },
  {
    id: 'duval-pentagon-2',
    step: 9,
    name: 'Duval Pentagon 2',
    purpose: 'Refines Pentagon 1’s thermal zones into more specific causes.',
    consumes: 'Pentagon 1’s computed point',
    produces: 'A refined zone: PD, D1, D2, S, O, C, or T3-H',
    detail:
      'Same point, different map. Pentagon 2 redraws the thermal regions to distinguish overheating without carbonization (O), possible paper carbonization (C), and severe thermal faults in oil only (T3-H). The electrical zones (PD, D1, D2) carry over unchanged.',
    inGasLab: true,
  },
  {
    id: 'recommendation',
    step: 10,
    name: 'Recommendation',
    purpose: 'Turns Status + fault zones into a severity tier and action list.',
    consumes: 'Status result + all Duval-family zones + C2H4 delta + C2H6 level',
    produces: 'A tier (Routine → Extreme) with recommended actions',
    detail:
      'The final engine never diagnoses anything new. It starts from Status (1→Routine, 2→Investigate, 3→Urgent), then lets the Duval zones adjust a Status-2 result: mild findings (PD, T1, S) soften it to Monitor, severe ones (D2, T3, T3-H, C) harden it to Urgent. Extreme gas movements — a C2H4 jump above 200 ppm or C2H6 above 1000 ppm — override everything to Extreme. Per IEEE, the output is decision support: it never replaces expert judgment.',
  },
];
