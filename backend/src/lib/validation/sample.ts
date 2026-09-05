import { AppError } from '../../types/errors.js';
import type { CreateSampleDto } from '../../types/index.js';

const REQUIRED_GAS_FIELDS = ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co', 'co2'] as const;

/**
 * Rejects a sample where every required gas concentration is exactly zero.
 * A real DGA reading virtually never has all seven gases at 0 ppm — this
 * signature is what an accidentally-empty form submission looks like once
 * blank inputs collapse to 0 in the frontend's number fields. Catches that
 * failure mode server-side even if a caller bypasses the wizard's own
 * client-side validation.
 */
export function validateSampleInput(input: CreateSampleDto): void {
  const allZero = REQUIRED_GAS_FIELDS.every((field) => input[field] === 0);
  if (allZero) {
    throw new AppError(
      400,
      'Sample rejected: all required gas concentrations (H2, CH4, C2H6, C2H4, C2H2, CO, CO2) are 0 ppm. Enter measured values before submitting.',
    );
  }
}
