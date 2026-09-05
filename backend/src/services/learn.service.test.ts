import { describe, expect, it } from 'vitest';
import type { GasSampleInput } from '../lib/analysis/types.js';
import { learnService } from './learn.service.js';

/**
 * These gas mixes mirror the Gas Lab fault presets in the frontend
 * (src/content/learn/presets.ts) — keep the two files in sync. Each test
 * pins the headline diagnosis the UI advertises for that preset, so a
 * boundary change in an engine that would silently move a preset into a
 * different zone fails here first.
 */
const PRESETS: Record<string, GasSampleInput> = {
  partialDischarge: { h2: 800, ch4: 300, c2h6: 30, c2h4: 3, c2h2: 0, co: 50, co2: 400 },
  lowEnergyArcing: { h2: 50, ch4: 120, c2h6: 15, c2h4: 20, c2h2: 60, co: 40, co2: 300 },
  highEnergyArcing: { h2: 250, ch4: 200, c2h6: 40, c2h4: 264, c2h2: 336, co: 90, co2: 500 },
  overheatedOil: { h2: 100, ch4: 150, c2h6: 60, c2h4: 420, c2h2: 30, co: 80, co2: 700 },
  overheatedPaper: { h2: 60, ch4: 80, c2h6: 20, c2h4: 40, c2h2: 0, co: 900, co2: 7000 },
  strayGassing: { h2: 100, ch4: 275, c2h6: 125, c2h4: 15, c2h2: 0, co: 90, co2: 900 },
  mildOverheating: { h2: 100, ch4: 400, c2h6: 60, c2h4: 75, c2h2: 10, co: 120, co2: 1000 },
};

describe('learnService.runSandbox', () => {
  it('returns all five gas-only engine results', () => {
    const result = learnService.runSandbox(PRESETS.overheatedOil);

    expect(result.keyGas).toBeDefined();
    expect(result.doernenburg).toBeDefined();
    expect(result.duvalTriangle.triangle1).toBeDefined();
    expect(result.duvalPentagon1).toBeDefined();
    expect(result.duvalPentagon2).toBeDefined();
  });

  it('is deterministic for the same input', () => {
    expect(learnService.runSandbox(PRESETS.highEnergyArcing)).toEqual(
      learnService.runSandbox(PRESETS.highEnergyArcing),
    );
  });

  it('handles an all-zero mix without throwing (engines report insufficient data)', () => {
    const zero: GasSampleInput = { h2: 0, ch4: 0, c2h6: 0, c2h4: 0, c2h2: 0, co: 0, co2: 0 };
    const result = learnService.runSandbox(zero);

    expect(result.duvalTriangle.triangle1.zone).toBeNull();
    expect(result.keyGas.diagnosis).toBe('INCONCLUSIVE');
  });

  describe('fault presets land in their advertised zones', () => {
    it('Partial Discharge → Triangle 1 PD, Key Gas PARTIAL_DISCHARGE', () => {
      const result = learnService.runSandbox(PRESETS.partialDischarge);
      expect(result.duvalTriangle.triangle1.zone).toBe('PD');
      expect(result.keyGas.diagnosis).toBe('PARTIAL_DISCHARGE');
    });

    it('Low-energy Arcing → Triangle 1 D1, Key Gas ARCING', () => {
      const result = learnService.runSandbox(PRESETS.lowEnergyArcing);
      expect(result.duvalTriangle.triangle1.zone).toBe('D1');
      expect(result.keyGas.diagnosis).toBe('ARCING');
    });

    it('High-energy Arcing → Triangle 1 D2, Key Gas ARCING', () => {
      const result = learnService.runSandbox(PRESETS.highEnergyArcing);
      expect(result.duvalTriangle.triangle1.zone).toBe('D2');
      expect(result.keyGas.diagnosis).toBe('ARCING');
    });

    it('Overheated Oil → Triangle 1 T3, Key Gas THERMAL_OIL', () => {
      const result = learnService.runSandbox(PRESETS.overheatedOil);
      expect(result.duvalTriangle.triangle1.zone).toBe('T3');
      expect(result.keyGas.diagnosis).toBe('THERMAL_OIL');
    });

    it('Overheated Paper → Triangle 1 T2, Key Gas THERMAL_CELLULOSE', () => {
      const result = learnService.runSandbox(PRESETS.overheatedPaper);
      expect(result.duvalTriangle.triangle1.zone).toBe('T2');
      expect(result.keyGas.diagnosis).toBe('THERMAL_CELLULOSE');
    });

    it('Stray Gassing → Triangle 1 T1 routing into Triangle 4 zone S', () => {
      const result = learnService.runSandbox(PRESETS.strayGassing);
      expect(result.duvalTriangle.triangle1.zone).toBe('T1');
      expect(result.duvalTriangle.triangle4?.zone).toBe('S');
    });

    it('Mild Overheating → Triangle 1 T1', () => {
      const result = learnService.runSandbox(PRESETS.mildOverheating);
      expect(result.duvalTriangle.triangle1.zone).toBe('T1');
    });
  });
});
