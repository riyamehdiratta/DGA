import { describe, expect, it } from 'vitest';
import { parseSandboxGasInput } from './sandbox.js';

const VALID_BODY = { h2: 100, ch4: 150, c2h6: 60, c2h4: 420, c2h2: 30, co: 80, co2: 700 };

describe('parseSandboxGasInput', () => {
  it('returns the seven gas fields for a valid body', () => {
    expect(parseSandboxGasInput(VALID_BODY)).toEqual(VALID_BODY);
  });

  it('drops unknown extra fields rather than passing them through', () => {
    const parsed = parseSandboxGasInput({ ...VALID_BODY, o2: 2000, injected: 'x' });
    expect(parsed).toEqual(VALID_BODY);
  });

  it('accepts an all-zero mix (the engines handle it as insufficient data)', () => {
    const zero = { h2: 0, ch4: 0, c2h6: 0, c2h4: 0, c2h2: 0, co: 0, co2: 0 };
    expect(parseSandboxGasInput(zero)).toEqual(zero);
  });

  it('rejects a non-object body', () => {
    expect(() => parseSandboxGasInput(null)).toThrow(/JSON object/);
    expect(() => parseSandboxGasInput('h2=5')).toThrow(/JSON object/);
  });

  it('rejects a missing gas field', () => {
    const { co2: _co2, ...missing } = VALID_BODY;
    expect(() => parseSandboxGasInput(missing)).toThrow(/"co2"/);
  });

  it('rejects non-numeric and non-finite values', () => {
    expect(() => parseSandboxGasInput({ ...VALID_BODY, h2: '100' })).toThrow(/"h2"/);
    expect(() => parseSandboxGasInput({ ...VALID_BODY, ch4: Number.NaN })).toThrow(/"ch4"/);
    expect(() => parseSandboxGasInput({ ...VALID_BODY, c2h2: Infinity })).toThrow(/"c2h2"/);
  });

  it('rejects negative values', () => {
    expect(() => parseSandboxGasInput({ ...VALID_BODY, c2h4: -1 })).toThrow(/negative/);
  });
});
