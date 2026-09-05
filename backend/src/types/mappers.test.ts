import type { AnalysisResult, DeltaResult, DgaSample } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { toAnalysisDto } from './mappers.js';

function makeSample(overrides: Partial<DgaSample> = {}): DgaSample {
  return {
    id: 'sample-1',
    transformerId: 'transformer-1',
    sampleDate: new Date('2026-01-01T00:00:00.000Z'),
    h2: 10,
    ch4: 10,
    c2h6: 10,
    c2h4: 10,
    c2h2: 10,
    co: 10,
    co2: 10,
    o2: 1000,
    n2: 10000,
    remarks: '',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: 'analysis-1',
    transformerId: 'transformer-1',
    sampleId: 'sample-1',
    normProfile: 'HIGH_RATIO',
    o2n2Ratio: 0.1,
    status: 'STATUS_1',
    statusResult: null,
    rateResult: null,
    keyGasResult: null,
    doernenburgResult: null,
    duvalTriangleResult: null,
    duvalPentagon1Result: null,
    duvalPentagon2Result: null,
    recommendationResult: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('toAnalysisDto', () => {
  it('passes through populated Json fields verbatim', () => {
    const statusResult = { status: 'STATUS_2', reasoning: ['x'], exceededThresholds: [] };
    const rateResult = { periodDays: 30, periodBucket: null, rates: {}, exceededThresholds: [], rateAvailable: false };
    const keyGasResult = { diagnosis: 'THERMAL_OIL', dominantGas: 'ch4', confidence: 'HIGH', reasoning: [] };
    const doernenburgResult = { diagnosis: 'ARCING', ratios: { r1: 1, r2: 1, r3: 1, r4: 1 }, reasoning: [] };
    const duvalTriangleResult = { triangle1: { zone: 'T2', percentages: null, warnings: [], reasoning: [] }, triangle4: null, triangle5: null };
    const duvalPentagon1Result = { diagnosis: 'D1', coordinates: { x: 0.1, y: 0.2 }, reasoning: [] };
    const duvalPentagon2Result = { diagnosis: 'D1', coordinates: { x: 0.1, y: 0.2 }, reasoning: [], matchedZone: 'D1' };
    const recommendationResult = { tier: 'MONITOR', actions: ['a'], reasoning: [] };

    const analysis = makeAnalysis({
      statusResult,
      rateResult,
      keyGasResult,
      doernenburgResult,
      duvalTriangleResult,
      duvalPentagon1Result,
      duvalPentagon2Result,
      recommendationResult,
    });
    const sample = makeSample();

    const dto = toAnalysisDto(analysis, sample, null, null);

    expect(dto.statusResult).toEqual(statusResult);
    expect(dto.rateResult).toEqual(rateResult);
    expect(dto.keyGasResult).toEqual(keyGasResult);
    expect(dto.doernenburgResult).toEqual(doernenburgResult);
    expect(dto.duvalTriangleResult).toEqual(duvalTriangleResult);
    expect(dto.duvalPentagon1Result).toEqual(duvalPentagon1Result);
    expect(dto.duvalPentagon2Result).toEqual(duvalPentagon2Result);
    expect(dto.recommendationResult).toEqual(recommendationResult);
    expect(dto.status).toBe('STATUS_1');
  });

  it('returns null for every engine result on a row with no persisted results (legacy/manual-create row)', () => {
    const analysis = makeAnalysis({ status: null });
    const sample = makeSample();

    const dto = toAnalysisDto(analysis, sample, null, null);

    expect(dto.status).toBeNull();
    expect(dto.statusResult).toBeNull();
    expect(dto.rateResult).toBeNull();
    expect(dto.keyGasResult).toBeNull();
    expect(dto.doernenburgResult).toBeNull();
    expect(dto.duvalTriangleResult).toBeNull();
    expect(dto.duvalPentagon1Result).toBeNull();
    expect(dto.duvalPentagon2Result).toBeNull();
    expect(dto.recommendationResult).toBeNull();
    expect(dto.delta).toBeNull();
  });

  it('builds delta DTO from a persisted DeltaResult row against the previous sample', () => {
    const analysis = makeAnalysis();
    const sample = makeSample({ h2: 15 });
    const previousSample = makeSample({ h2: 10 });
    const deltaRecord: DeltaResult = {
      id: 'delta-1',
      analysisId: 'analysis-1',
      h2Delta: 5,
      ch4Delta: 0,
      c2h6Delta: 0,
      c2h4Delta: 0,
      c2h2Delta: 0,
      coDelta: 0,
      co2Delta: 0,
    };

    const dto = toAnalysisDto(analysis, sample, previousSample, deltaRecord);

    expect(dto.delta).toEqual({
      h2: { previous: 10, current: 15, delta: 5 },
      ch4: { previous: 10, current: 10, delta: 0 },
      c2h6: { previous: 10, current: 10, delta: 0 },
      c2h4: { previous: 10, current: 10, delta: 0 },
      c2h2: { previous: 10, current: 10, delta: 0 },
      co: { previous: 10, current: 10, delta: 0 },
      co2: { previous: 10, current: 10, delta: 0 },
    });
  });
});
