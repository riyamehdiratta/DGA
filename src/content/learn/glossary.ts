export interface GasCard {
  formula: string;
  name: string;
  /** What kind of fault/temperature produces this gas. */
  bornFrom: string;
  /** What an elevated reading tends to signal. */
  signals: string;
}

/** The seven IEEE C57.104 gases, in the order the rest of the app uses. */
export const GAS_CARDS: GasCard[] = [
  {
    formula: 'H₂',
    name: 'Hydrogen',
    bornFrom: 'Almost any fault — the first gas to appear, from as little as ~150 °C or any electrical discharge.',
    signals: 'Dominant H₂ with little else points to partial discharge (corona). Rising H₂ is the universal early-warning gas.',
  },
  {
    formula: 'CH₄',
    name: 'Methane',
    bornFrom: 'Low-temperature thermal faults and stray gassing of the oil.',
    signals: 'Elevated with H₂ at low temperatures; its share versus ethylene helps separate mild from severe overheating.',
  },
  {
    formula: 'C₂H₆',
    name: 'Ethane',
    bornFrom: 'Low-temperature oil breakdown (with methane) and stray gassing.',
    signals: 'A "cool fault" gas. IEEE treats a level above 1000 ppm as an extreme finding on its own.',
  },
  {
    formula: 'C₂H₄',
    name: 'Ethylene',
    bornFrom: 'High-temperature thermal faults in oil (above roughly 300 °C, dominating above 700 °C).',
    signals: 'The key gas of overheated oil. A jump of more than 200 ppm between samples is an extreme finding.',
  },
  {
    formula: 'C₂H₂',
    name: 'Acetylene',
    bornFrom: 'Arcing — it takes an electrical arc (thousands of °C) to make it in quantity.',
    signals: 'The most alarming gas: more than a trace suggests discharge activity. Central to the D1/D2 arcing zones.',
  },
  {
    formula: 'CO',
    name: 'Carbon monoxide',
    bornFrom: 'Overheated cellulose (paper) insulation.',
    signals: 'The key gas of paper degradation. Faults that involve paper matter more, because paper is not replaceable.',
  },
  {
    formula: 'CO₂',
    name: 'Carbon dioxide',
    bornFrom: 'Cellulose ageing and overheating (also normal ageing in air-breathing units).',
    signals: 'Read together with CO: a shifting CO₂/CO relationship strengthens the case that paper is involved.',
  },
];

export type GlossaryCategory =
  | 'Fault codes'
  | 'Methods & engines'
  | 'Ratios & measures'
  | 'Status & severity';

export interface GlossaryTerm {
  term: string;
  fullName?: string;
  category: GlossaryCategory;
  definition: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ——— Fault codes (Duval vocabulary) ———
  {
    term: 'PD',
    fullName: 'Partial Discharge',
    category: 'Fault codes',
    definition:
      'Low-energy electrical discharges (corona) that produce mostly hydrogen. Damaging over years rather than minutes.',
  },
  {
    term: 'D1',
    fullName: 'Low-energy Discharge',
    category: 'Fault codes',
    definition: 'Sparking and small arcs — significant acetylene appears alongside hydrogen.',
  },
  {
    term: 'D2',
    fullName: 'High-energy Discharge',
    category: 'Fault codes',
    definition:
      'Power arcing with heavy acetylene and ethylene. The most destructive electrical fault; escalates a Status-2 result to Urgent.',
  },
  {
    term: 'T1',
    fullName: 'Thermal fault < 300 °C',
    category: 'Fault codes',
    definition:
      'Mild overheating. Treated as lower urgency, though it can still shorten insulation life over time.',
  },
  {
    term: 'T2',
    fullName: 'Thermal fault 300–700 °C',
    category: 'Fault codes',
    definition: 'Moderate overheating — hot enough to crack oil into ethylene in quantity.',
  },
  {
    term: 'T3',
    fullName: 'Thermal fault > 700 °C',
    category: 'Fault codes',
    definition:
      'Severe overheating, often visible as carbonized oil. Escalates a Status-2 result to Urgent.',
  },
  {
    term: 'DT',
    fullName: 'Mixed Discharge/Thermal',
    category: 'Fault codes',
    definition: 'The gas pattern shows both electrical and thermal characteristics at once.',
  },
  {
    term: 'S',
    fullName: 'Stray Gassing',
    category: 'Fault codes',
    definition:
      'Some oils generate hydrogen and ethane at ordinary operating temperatures without any fault. Triangle 4 and the Pentagons exist partly to keep this from being mistaken for a real problem.',
  },
  {
    term: 'O',
    fullName: 'Overheating < 250 °C',
    category: 'Fault codes',
    definition: 'Mild overheating without paper carbonization (Triangle 4/5 and Pentagon 2 vocabulary).',
  },
  {
    term: 'C',
    fullName: 'Possible paper carbonization',
    category: 'Fault codes',
    definition:
      'The thermal fault appears to involve the cellulose insulation. Paper cannot be replaced, so this escalates a Status-2 result to Urgent.',
  },
  {
    term: 'T3-H',
    fullName: 'Severe thermal fault, oil only',
    category: 'Fault codes',
    definition: 'Pentagon 2’s refinement of T3: very high temperature but confined to the oil ("H" for huile).',
  },
  {
    term: 'ND',
    fullName: 'Not Determined',
    category: 'Fault codes',
    definition: 'The point falls in a region where the refinement triangle cannot name a specific cause.',
  },
  // ——— Methods & engines ———
  {
    term: 'DGA',
    fullName: 'Dissolved Gas Analysis',
    category: 'Methods & engines',
    definition:
      'Faults inside a transformer decompose the insulating oil and paper into gases that dissolve in the oil. Measuring those gases reveals what is happening inside without opening the tank.',
  },
  {
    term: 'Key Gas Method',
    category: 'Methods & engines',
    definition:
      'Identifies the fault family from the single dominant gas. Fast but crude — IEEE reports roughly 50% of automated cases are wrong or inconclusive, so it is only a first hint.',
  },
  {
    term: 'Doernenburg Ratios',
    category: 'Methods & engines',
    definition:
      'Classifies the fault from four gas-to-gas ratios (R1–R4). More robust than Key Gas, but answers Inconclusive when the pattern is not clean.',
  },
  {
    term: 'Duval Triangle',
    category: 'Methods & engines',
    definition:
      'Plots CH₄/C₂H₄/C₂H₂ percentages as a point in a triangle whose regions are fault zones. Triangles 4 and 5 re-plot with different gases to refine low-temperature results.',
  },
  {
    term: 'Duval Pentagon',
    category: 'Methods & engines',
    definition:
      'Places all five hydrocarbon gases on a five-axis map; the centroid of the resulting shape lands in a fault zone. Pentagon 2 refines the thermal zones.',
  },
  {
    term: 'Norm Profile',
    category: 'Methods & engines',
    definition:
      'Which set of IEEE threshold tables applies to a transformer, decided by its O₂/N₂ ratio (how the unit is sealed). Low Ratio, High Ratio, or Default High Ratio when O₂/N₂ was not measured.',
  },
  // ——— Ratios & measures ———
  {
    term: 'ppm',
    fullName: 'parts per million (µL/L)',
    category: 'Ratios & measures',
    definition: 'The unit of every dissolved-gas concentration: microlitres of gas per litre of oil.',
  },
  {
    term: 'TDCG',
    fullName: 'Total Dissolved Combustible Gas',
    category: 'Ratios & measures',
    definition:
      'The sum of the combustible gases (H₂, CH₄, C₂H₆, C₂H₄, C₂H₂, CO). A single number for "how much is going on" overall.',
  },
  {
    term: 'R1–R4',
    fullName: 'Doernenburg ratios',
    category: 'Ratios & measures',
    definition: 'R1 = CH₄/H₂, R2 = C₂H₂/C₂H₄, R3 = C₂H₂/CH₄, R4 = C₂H₆/C₂H₂.',
  },
  {
    term: 'Delta (Δ)',
    category: 'Ratios & measures',
    definition:
      'The change in a gas since the previous sample, in ppm. Sudden jumps matter even when absolute levels look acceptable.',
  },
  {
    term: 'Generation rate',
    category: 'Ratios & measures',
    definition:
      'How fast a gas is being produced, annualized to ppm/year from the recent sample history and checked against IEEE Table 4.',
  },
  {
    term: 'O₂/N₂ ratio',
    category: 'Ratios & measures',
    definition:
      'Oxygen divided by nitrogen. Reveals how much the unit breathes air, which decides the Norm Profile (sealed units run low O₂/N₂).',
  },
  // ——— Status & severity ———
  {
    term: 'Status 1',
    category: 'Status & severity',
    definition:
      'Normal: every gas within its Table 1 limit and every recent change within Table 3. Continue routine sampling.',
  },
  {
    term: 'Status 2',
    category: 'Status & severity',
    definition:
      'Elevated: not fully normal, but nothing beyond the Table 2 or Table 4 alarm limits either. Investigate and watch more closely.',
  },
  {
    term: 'Status 3',
    category: 'Status & severity',
    definition:
      'High: some gas exceeds its Table 2 limit or is being generated faster than Table 4 allows. Act — increased surveillance and further testing.',
  },
  {
    term: 'Severity tier',
    category: 'Status & severity',
    definition:
      'The Recommendation engine’s output: Routine < Monitor < Investigate < Urgent < Extreme, derived from Status plus the Duval fault zones. Decision support, never a substitute for expert judgment.',
  },
  {
    term: 'IEEE C57.104-2019',
    category: 'Status & severity',
    definition:
      'The IEEE guide this entire system implements: threshold tables, status logic, and the interpretation methods for mineral-oil-filled transformers.',
  },
];
