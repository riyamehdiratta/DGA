import { apiClient } from './client';
import type {
  DoernenburgResult,
  DuvalPentagon1Result,
  DuvalPentagon2Result,
  DuvalTriangleResult,
  KeyGasResult,
} from '@/types';

/** The seven gas concentrations (ppm) the Gas Lab sandbox operates on. */
export interface SandboxGasInput {
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
}

/**
 * Result of a stateless sandbox run: only the gas-only engines. Status, Rate,
 * Delta, and Recommendation need sample history and a transformer, so the
 * sandbox never returns them.
 */
export interface SandboxRunResponse {
  keyGas: KeyGasResult;
  doernenburg: DoernenburgResult;
  duvalTriangle: DuvalTriangleResult;
  duvalPentagon1: DuvalPentagon1Result;
  duvalPentagon2: DuvalPentagon2Result;
}

export async function runSandboxApi(gases: SandboxGasInput): Promise<SandboxRunResponse> {
  return apiClient.post<SandboxRunResponse>('/learn/sandbox', gases);
}
