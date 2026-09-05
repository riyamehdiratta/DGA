import type { DgaSample, Transformer } from '@/types';

export type NormProfile = 'LOW_RATIO' | 'HIGH_RATIO' | 'DEFAULT_HIGH_RATIO';

export interface DeltaGas {
  previous: number | null;
  current: number;
  delta: number | null;
}

export interface DeltaResult {
  h2: DeltaGas;
  ch4: DeltaGas;
  c2h6: DeltaGas;
  c2h4: DeltaGas;
  c2h2: DeltaGas;
  co: DeltaGas;
  co2: DeltaGas;
}

export interface AnalysisResult {
  id: string;
  transformerId: string;
  sampleId: string;
  createdAt: string;

  normProfile: NormProfile;
  o2n2Ratio: number | null;

  delta?: DeltaResult | null;
  status?: string | null;
  keyGasResult?: string | null;
  rogersResult?: string | null;
  duvalTriangleResult?: string | null;
  duvalPentagonResult?: string | null;
}

/** Shared context passed to each engine in the analysis pipeline. */
export interface AnalysisPipelineContext {
  sample: DgaSample;
  transformer: Transformer;
  previousSample: DgaSample | null;
  normProfile: NormProfile;
  o2n2Ratio: number | null;
}

export interface AnalysisRunOptions {
  id: string;
  createdAt: string;
  previousSample?: DgaSample | null;
}

export interface NormProfileSelection {
  o2n2Ratio: number | null;
  normProfile: NormProfile;
}

export interface DeltaAnalysisRow {
  gas: string;
  previous: number | null;
  current: number;
  delta: number | null;
}
