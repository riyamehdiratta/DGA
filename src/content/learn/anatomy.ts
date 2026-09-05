export interface AnatomyHotspot {
  id: string;
  /** Number shown inside the hotspot marker, in reading order. */
  number: number;
  label: string;
  /** Marker position within the cutaway SVG's 480×360 viewBox. */
  at: { x: number; y: number };
  whatHappens: string;
  gases: string;
  detectedBy: string;
  faultCodes: string[];
  /** Gas Lab preset that demonstrates this fault (src/content/learn/presets.ts id). */
  presetId: string;
  presetLabel: string;
}

export const ANATOMY_HOTSPOTS: AnatomyHotspot[] = [
  {
    id: 'windings',
    number: 1,
    label: 'Windings',
    at: { x: 168, y: 208 },
    whatHappens:
      'The copper coils carry the full load current. Insulation weaknesses, loose connections, or transient overvoltages can strike arcs between turns — the most violent thing that can happen inside the tank.',
    gases: 'Arcing cracks oil directly into acetylene (C₂H₂) plus hydrogen; severe arcs add ethylene.',
    detectedBy:
      'Acetylene-heavy signatures: Duval zones D1/D2, Key Gas “Arcing”, Doernenburg “Arcing”.',
    faultCodes: ['D1', 'D2', 'PD'],
    presetId: 'highEnergyArcing',
    presetLabel: 'High-energy Arcing',
  },
  {
    id: 'paper',
    number: 2,
    label: 'Paper insulation',
    at: { x: 312, y: 208 },
    whatHappens:
      'Every winding turn is wrapped in cellulose paper. It ages irreversibly with heat — and unlike oil, it can never be replaced. A fault that involves paper always matters more.',
    gases: 'Degrading cellulose releases carbon monoxide (CO) and carbon dioxide (CO₂).',
    detectedBy:
      'CO-dominant Key Gas (“Thermal — Cellulose”), carbonization zones C in Triangle 4/5 and Pentagon 2.',
    faultCodes: ['C', 'T2'],
    presetId: 'overheatedPaper',
    presetLabel: 'Overheated Paper',
  },
  {
    id: 'oil',
    number: 3,
    label: 'Insulating oil',
    at: { x: 240, y: 296 },
    whatHappens:
      'Mineral oil insulates and carries heat away. Localized hot spots crack it into hydrocarbon gases — and some oils quietly “stray gas” at ordinary temperatures with no fault at all.',
    gases:
      'Low heat: hydrogen, methane, ethane. High heat: ethylene dominates. Stray gassing: hydrogen + ethane.',
    detectedBy:
      'Thermal zones T1–T3 in the Duval methods; Triangle 4 and the Pentagons separate genuine faults from stray gassing (S).',
    faultCodes: ['T1', 'T2', 'T3', 'S'],
    presetId: 'strayGassing',
    presetLabel: 'Stray Gassing',
  },
  {
    id: 'core',
    number: 4,
    label: 'Core',
    at: { x: 240, y: 130 },
    whatHappens:
      'The laminated steel core channels the magnetic flux. Shorted laminations or unintended ground paths let circulating currents flow, creating intense localized heating of metal in oil.',
    gases: 'Hot metal surfaces crack oil into ethylene and methane — the hotter the spot, the more ethylene.',
    detectedBy: 'High-temperature thermal zones (T2/T3, Pentagon 2’s T3-H) with no CO involvement.',
    faultCodes: ['T2', 'T3', 'T3-H'],
    presetId: 'overheatedOil',
    presetLabel: 'Overheated Oil',
  },
  {
    id: 'connections',
    number: 5,
    label: 'Bushings & connections',
    at: { x: 215, y: 40 },
    whatHappens:
      'Bushings bring the conductors through the tank wall; every bolted or crimped joint is a potential bad contact. A loose joint heats gently but persistently under load.',
    gases: 'Sustained mild heating produces methane and ethane, with modest ethylene.',
    detectedBy: 'Low-temperature thermal zones: T1 in Triangle 1, O in the refinement methods.',
    faultCodes: ['T1', 'O'],
    presetId: 'mildOverheating',
    presetLabel: 'Mild Overheating',
  },
];
