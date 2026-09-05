import type { SandboxGasInput } from '@/api/learn';

export interface FaultPreset {
  id: string;
  label: string;
  /** The headline zone/verdict this mix is verified to produce. */
  headline: string;
  description: string;
  gases: SandboxGasInput;
}

/**
 * Representative gas mixes for the Gas Lab. Each mix is verified to land in
 * its advertised zone by backend/src/services/learn.service.test.ts — keep
 * the two files in sync when changing any value.
 */
export const FAULT_PRESETS: FaultPreset[] = [
  {
    id: 'partialDischarge',
    label: 'Partial Discharge',
    headline: 'Triangle 1 → PD · Key Gas → Partial Discharge',
    description:
      'Hydrogen-dominated mix with almost no heavier hydrocarbons — the signature of low-energy electrical discharges (corona) in oil.',
    gases: { h2: 800, ch4: 300, c2h6: 30, c2h4: 3, c2h2: 0, co: 50, co2: 400 },
  },
  {
    id: 'mildOverheating',
    label: 'Mild Overheating',
    headline: 'Triangle 1 → T1',
    description:
      'Methane-rich mix with little ethylene and only a trace of acetylene — a thermal fault below 300 °C.',
    gases: { h2: 100, ch4: 400, c2h6: 60, c2h4: 75, c2h2: 10, co: 120, co2: 1000 },
  },
  {
    id: 'strayGassing',
    label: 'Stray Gassing',
    headline: 'Triangle 1 → T1, refined by Triangle 4 → S',
    description:
      'Hydrogen and ethane from the oil itself at modest temperatures — not a genuine fault, which is why Triangle 4 exists to separate it.',
    gases: { h2: 100, ch4: 275, c2h6: 125, c2h4: 15, c2h2: 0, co: 90, co2: 900 },
  },
  {
    id: 'overheatedOil',
    label: 'Overheated Oil',
    headline: 'Triangle 1 → T3 · Key Gas → Thermal (Oil)',
    description:
      'Ethylene-dominated mix — mineral oil breaking down at high temperature (above 700 °C).',
    gases: { h2: 100, ch4: 150, c2h6: 60, c2h4: 420, c2h2: 30, co: 80, co2: 700 },
  },
  {
    id: 'overheatedPaper',
    label: 'Overheated Paper',
    headline: 'Triangle 1 → T2 · Key Gas → Thermal (Cellulose)',
    description:
      'Carbon monoxide far above every hydrocarbon — the cellulose paper insulation is degrading, not just the oil.',
    gases: { h2: 60, ch4: 80, c2h6: 20, c2h4: 40, c2h2: 0, co: 900, co2: 7000 },
  },
  {
    id: 'lowEnergyArcing',
    label: 'Low-energy Arcing',
    headline: 'Triangle 1 → D1 · Key Gas → Arcing',
    description:
      'Significant acetylene with limited ethylene — sparking and low-energy discharges.',
    gases: { h2: 50, ch4: 120, c2h6: 15, c2h4: 20, c2h2: 60, co: 40, co2: 300 },
  },
  {
    id: 'highEnergyArcing',
    label: 'High-energy Arcing',
    headline: 'Triangle 1 → D2 · Key Gas → Arcing',
    description:
      'Heavy acetylene and ethylene together — power-follow-through arcing, the most destructive electrical fault.',
    gases: { h2: 250, ch4: 200, c2h6: 40, c2h4: 264, c2h2: 336, co: 90, co2: 500 },
  },
];

export function getPreset(id: string): FaultPreset | undefined {
  return FAULT_PRESETS.find((preset) => preset.id === id);
}
