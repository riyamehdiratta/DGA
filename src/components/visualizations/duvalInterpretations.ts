/**
 * Presentational zone descriptions (IEEE C57.104 zone semantics).
 * Display text only — the zone itself always comes from the backend.
 */

export const TRIANGLE1_INTERPRETATIONS: Record<string, string> = {
  PD: 'Partial discharge',
  T1: 'Thermal fault < 300 °C',
  T2: 'Thermal fault 300–700 °C',
  T3: 'Thermal fault > 700 °C',
  DT: 'Mixed electrical and thermal fault',
  D1: 'Low-energy discharge',
  D2: 'High-energy discharge',
  UNCLASSIFIED: 'Percentages did not match a defined zone',
};

export const TRIANGLE4_INTERPRETATIONS: Record<string, string> = {
  PD: 'Partial discharge (corona)',
  S: 'Stray gassing of mineral oil',
  O: 'Overheating < 250 °C',
  C: 'Possible paper carbonization',
  ND: 'Not determined',
  UNCLASSIFIED: 'Percentages did not match a defined zone',
};

export const TRIANGLE5_INTERPRETATIONS: Record<string, string> = {
  PD: 'Partial discharge (corona)',
  O: 'Overheating < 250 °C',
  S: 'Stray gassing of mineral oil',
  T2: 'Thermal fault 300–700 °C',
  T3: 'Thermal fault > 700 °C',
  C: 'Possible paper carbonization',
  ND: 'Not determined',
  UNCLASSIFIED: 'Percentages did not match a defined zone',
};

export const PENTAGON1_INTERPRETATIONS: Record<string, string> = {
  PD: 'Partial discharge (corona)',
  D1: 'Low-energy discharge',
  D2: 'High-energy discharge',
  T1: 'Thermal fault < 300 °C',
  T2: 'Thermal fault 300–700 °C',
  T3: 'Thermal fault > 700 °C',
  S: 'Stray gassing of mineral oil',
  OUTSIDE: 'Centroid fell outside every defined zone',
};

export const PENTAGON2_INTERPRETATIONS: Record<string, string> = {
  PD: 'Partial discharge (corona)',
  D1: 'Low-energy discharge',
  D2: 'High-energy discharge',
  S: 'Stray gassing of mineral oil',
  O: 'Overheating < 250 °C',
  C: 'Possible paper carbonization',
  'T3-H': 'High-temperature thermal fault in oil',
  OUTSIDE: 'Centroid fell outside every defined zone',
};
