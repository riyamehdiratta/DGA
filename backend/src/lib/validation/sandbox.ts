import { AppError } from '../../types/errors.js';
import type { GasSampleInput } from '../analysis/types.js';

const GAS_FIELDS = ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co', 'co2'] as const;

/**
 * Parses an untrusted request body into a GasSampleInput for the Learn
 * sandbox. Unlike stored samples, sandbox input never touches the database,
 * so the only requirements are that all seven gases are present, numeric,
 * finite, and non-negative.
 */
export function parseSandboxGasInput(body: unknown): GasSampleInput {
  if (body === null || typeof body !== 'object') {
    throw new AppError(400, 'Request body must be a JSON object of gas concentrations (ppm).');
  }
  const record = body as Record<string, unknown>;
  const sample = {} as GasSampleInput;
  for (const field of GAS_FIELDS) {
    const value = record[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new AppError(400, `Field "${field}" must be a finite number (ppm).`);
    }
    if (value < 0) {
      throw new AppError(400, `Field "${field}" must not be negative.`);
    }
    sample[field] = value;
  }
  return sample;
}
