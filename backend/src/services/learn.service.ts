import { runDoernenburgEngine } from '../lib/analysis/doernenburg.js';
import { runDuvalPentagon1Engine } from '../lib/analysis/duvalPentagon1.js';
import { runDuvalPentagon2Engine } from '../lib/analysis/duvalPentagon2.js';
import { runDuvalTriangleEngine } from '../lib/analysis/duvalTriangle.js';
import { runKeyGasEngine } from '../lib/analysis/keyGas.js';
import type { GasSampleInput } from '../lib/analysis/types.js';
import type { SandboxRunResponseDto } from '../types/index.js';

/**
 * Stateless educational sandbox behind the frontend "Gas Lab". Runs only the
 * gas-only diagnostic engines against an arbitrary gas mix — no database
 * access, nothing persisted, no Status/Rate/Delta/Recommendation (those need
 * sample history and a real transformer).
 */
export class LearnService {
  runSandbox(sample: GasSampleInput): SandboxRunResponseDto {
    const keyGas = runKeyGasEngine(sample);
    const doernenburg = runDoernenburgEngine(sample);
    const duvalTriangle = runDuvalTriangleEngine(sample);
    const duvalPentagon1 = runDuvalPentagon1Engine(sample);
    // Pentagon 2 reuses Pentagon 1's coordinate rather than recomputing it,
    // same as runAnalysisPipeline.
    const duvalPentagon2 = runDuvalPentagon2Engine(duvalPentagon1);

    return { keyGas, doernenburg, duvalTriangle, duvalPentagon1, duvalPentagon2 };
  }
}

export const learnService = new LearnService();
