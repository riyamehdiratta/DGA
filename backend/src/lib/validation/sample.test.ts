import { describe, expect, it } from 'vitest';
import { validateSampleInput } from './sample.js';
import { AppError } from '../../types/errors.js';
import type { CreateSampleDto } from '../../types/index.js';

function makeSample(overrides: Partial<CreateSampleDto> = {}): CreateSampleDto {
  return {
    sampleDate: '2026-01-01',
    h2: 0,
    ch4: 0,
    c2h6: 0,
    c2h4: 0,
    c2h2: 0,
    co: 0,
    co2: 0,
    o2: null,
    n2: null,
    remarks: '',
    ...overrides,
  };
}

describe('validateSampleInput', () => {
  it('rejects a sample where every required gas is exactly 0', () => {
    expect(() => validateSampleInput(makeSample())).toThrow(AppError);
  });

  it('accepts a sample with at least one nonzero required gas', () => {
    expect(() => validateSampleInput(makeSample({ h2: 5 }))).not.toThrow();
  });

  it('accepts a sample where every required gas is legitimately nonzero', () => {
    expect(() =>
      validateSampleInput(makeSample({ h2: 40, ch4: 20, c2h6: 15, c2h4: 25, c2h2: 2, co: 500, co2: 3500 })),
    ).not.toThrow();
  });

  it('does not treat optional O2/N2 fields as required', () => {
    // All required gases 0, only optional fields set — still rejected.
    expect(() => validateSampleInput(makeSample({ o2: 21000, n2: 78000 }))).toThrow(AppError);
  });
});
