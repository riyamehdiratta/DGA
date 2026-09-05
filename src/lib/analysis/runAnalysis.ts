import type { DgaSample, Transformer } from '@/types';
import { runDeltaEngine } from './delta';
import { runDuvalPentagonEngine } from './duvalPentagon';
import { runDuvalTriangleEngine } from './duvalTriangle';
import { runKeyGasEngine } from './keyGas';
import { runNormProfileEngine } from './normProfile';
import { runRogersEngine } from './rogers';
import { runStatusEngine } from './status';
import type { AnalysisPipelineContext, AnalysisResult, AnalysisRunOptions } from './types';

/**
 * Central analysis pipeline — orchestrates all diagnostic engines.
 * Currently runs Norm Profile only; additional engines are wired as stubs.
 */
export function runAnalysis(
  sample: DgaSample,
  transformer: Transformer,
  options: AnalysisRunOptions,
): AnalysisResult {
  const { id, createdAt, previousSample = null } = options;

  const { o2n2Ratio, normProfile } = runNormProfileEngine(sample);

  const context: AnalysisPipelineContext = {
    sample,
    transformer,
    previousSample,
    normProfile,
    o2n2Ratio,
  };

  const delta = runDeltaEngine(sample, previousSample);
  const status = runStatusEngine(context);
  const keyGasResult = runKeyGasEngine(context);
  const rogersResult = runRogersEngine(context);
  const duvalTriangleResult = runDuvalTriangleEngine(context);
  const duvalPentagonResult = runDuvalPentagonEngine(context);

  return {
    id,
    transformerId: sample.transformerId,
    sampleId: sample.id,
    createdAt,
    normProfile,
    o2n2Ratio,
    delta,
    status: status ?? null,
    keyGasResult: keyGasResult ?? null,
    rogersResult: rogersResult ?? null,
    duvalTriangleResult: duvalTriangleResult ?? null,
    duvalPentagonResult: duvalPentagonResult ?? null,
  };
}
