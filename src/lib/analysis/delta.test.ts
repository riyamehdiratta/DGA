import { describe, expect, it } from 'vitest';
import type { DgaSample } from '@/types';
import {
  deltaResultToRows,
  formatDeltaValue,
  hasDeltaComparison,
  runDeltaEngine,
} from './delta';

function makeSample(overrides: Partial<DgaSample> = {}): DgaSample {
  return {
    id: 'sample-1',
    transformerId: 'tx-1',
    sampleDate: '2026-06-01',
    h2: 50,
    ch4: 20,
    c2h6: 10,
    c2h4: 15,
    c2h2: 1,
    co: 300,
    co2: 2500,
    o2: 8000,
    n2: 40000,
    remarks: '',
    ...overrides,
  };
}

describe('runDeltaEngine', () => {
  it('computes current - previous for all delta gases when previous sample exists', () => {
    const previous = makeSample({
      h2: 48,
      ch4: 14,
      c2h6: 10,
      c2h4: 30,
      c2h2: 0,
      co: 335,
      co2: 2800,
    });

    const current = makeSample({
      h2: 65,
      ch4: 32,
      c2h6: 18,
      c2h4: 45,
      c2h2: 8,
      co: 410,
      co2: 3200,
    });

    const result = runDeltaEngine(current, previous);

    expect(result.h2).toEqual({ previous: 48, current: 65, delta: 17 });
    expect(result.ch4).toEqual({ previous: 14, current: 32, delta: 18 });
    expect(result.c2h6).toEqual({ previous: 10, current: 18, delta: 8 });
    expect(result.c2h4).toEqual({ previous: 30, current: 45, delta: 15 });
    expect(result.c2h2).toEqual({ previous: 0, current: 8, delta: 8 });
    expect(result.co).toEqual({ previous: 335, current: 410, delta: 75 });
    expect(result.co2).toEqual({ previous: 2800, current: 3200, delta: 400 });
  });

  it('returns null previous and delta when no previous sample exists', () => {
    const current = makeSample({ h2: 71, ch4: 42, co2: 4680 });

    const result = runDeltaEngine(current, null);

    expect(result.h2).toEqual({ previous: null, current: 71, delta: null });
    expect(result.ch4).toEqual({ previous: null, current: 42, delta: null });
    expect(result.co2).toEqual({ previous: null, current: 4680, delta: null });
    expect(hasDeltaComparison(result)).toBe(false);
  });

  it('handles negative deltas', () => {
    const previous = makeSample({ h2: 80, co: 400 });
    const current = makeSample({ h2: 65, co: 350 });

    const result = runDeltaEngine(current, previous);

    expect(result.h2.delta).toBe(-15);
    expect(result.co.delta).toBe(-50);
  });
});

describe('deltaResultToRows', () => {
  it('maps delta result to table rows in gas order', () => {
    const result = runDeltaEngine(
      makeSample({ h2: 60, ch4: 25 }),
      makeSample({ h2: 50, ch4: 20 }),
    );

    const rows = deltaResultToRows(result);

    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual({
      gas: 'H2',
      previous: 50,
      current: 60,
      delta: 10,
    });
    expect(rows[1]).toEqual({
      gas: 'CH4',
      previous: 20,
      current: 25,
      delta: 5,
    });
  });
});

describe('formatDeltaValue', () => {
  it('formats signed delta values and null as em dash', () => {
    expect(formatDeltaValue(null)).toBe('—');
    expect(formatDeltaValue(0)).toBe('0');
    expect(formatDeltaValue(17)).toBe('+17');
    expect(formatDeltaValue(-15)).toBe('-15');
  });
});

describe('hasDeltaComparison', () => {
  it('returns true when previous values are present', () => {
    const result = runDeltaEngine(makeSample(), makeSample({ h2: 40 }));
    expect(hasDeltaComparison(result)).toBe(true);
  });

  it('returns false for baseline samples', () => {
    const result = runDeltaEngine(makeSample(), null);
    expect(hasDeltaComparison(result)).toBe(false);
  });
});
