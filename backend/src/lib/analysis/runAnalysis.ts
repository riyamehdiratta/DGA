import { runDeltaEngine } from './delta.js';
import { runDoernenburgEngine } from './doernenburg.js';
import { runDuvalPentagon1Engine } from './duvalPentagon1.js';
import { runDuvalPentagon2Engine } from './duvalPentagon2.js';
import { runDuvalTriangleEngine } from './duvalTriangle.js';
import { runKeyGasEngine } from './keyGas.js';
import { runNormProfileEngine } from './normProfile.js';
import { runRateEngine } from './rate.js';
import { runRecommendationEngine } from './recommendation.js';
import { resolveTransformerAgeCategory, runStatusEngine } from './status.js';
import type { NormProfileSampleInput, PipelineResult, RateSampleInput } from './types.js';

/**
 * @param previousSamples Prior samples for this transformer, ordered most-recent-first
 *   (same convention as the repository's existing lookup). Used by the Delta Engine
 *   (only the first element) and the Rate Engine (up to 6 most recent, combined with
 *   the current sample).
 */
export function runAnalysisPipeline(
  sample: NormProfileSampleInput,
  previousSamples: RateSampleInput[],
  commissioningDate: Date,
  sampleDate: Date,
): PipelineResult {
  const { o2n2Ratio, normProfile } = runNormProfileEngine(sample);
  const mostRecentPrevious = previousSamples[0] ?? null;
  const delta = runDeltaEngine(sample, mostRecentPrevious);
  // Rate must run before Status — the Status Engine depends on Rate's output
  // for Table 4 evaluation (ANALYSIS_PIPELINE.md pipeline order).
  const rate = runRateEngine([...previousSamples, { ...sample, sampleDate }], normProfile);
  const ageCategory = resolveTransformerAgeCategory(commissioningDate, sampleDate);
  const statusResult = runStatusEngine({
    normProfile,
    ageCategory,
    sample,
    delta,
    rate,
  });
  // Key Gas, Doernenburg, Duval Triangle, and Duval Pentagon 1 run after
  // Status (ANALYSIS_PIPELINE.md order) but only depend on the current
  // sample's gas concentrations — independent of every other result and of
  // each other.
  const keyGas = runKeyGasEngine(sample);
  const doernenburg = runDoernenburgEngine(sample);
  const duvalTriangle = runDuvalTriangleEngine(sample);
  const duvalPentagon1 = runDuvalPentagon1Engine(sample);
  // Duval Pentagon 2 must run after Pentagon 1 — it reuses Pentagon 1's
  // coordinate directly rather than recomputing it.
  const duvalPentagon2 = runDuvalPentagon2Engine(duvalPentagon1);
  // Recommendation runs last — it consumes Status and the Duval-family
  // results already computed above and never performs a new diagnosis.
  const recommendation = runRecommendationEngine({
    status: statusResult.status,
    duvalTriangle1Zone: duvalTriangle.triangle1.zone,
    duvalTriangle4Zone: duvalTriangle.triangle4?.zone ?? null,
    duvalTriangle5Zone: duvalTriangle.triangle5?.zone ?? null,
    duvalPentagon1Diagnosis: duvalPentagon1.diagnosis,
    duvalPentagon2Diagnosis: duvalPentagon2.diagnosis,
    c2h4Delta: delta.c2h4.delta,
    c2h6Level: sample.c2h6,
  });

  return {
    normProfile,
    o2n2Ratio,
    delta,
    status: statusResult.status,
    statusResult,
    rate,
    keyGas,
    doernenburg,
    duvalTriangle,
    duvalPentagon1,
    duvalPentagon2,
    recommendation,
  };
}