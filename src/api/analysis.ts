import { apiClient } from './client';
import type { AnalysisResult, CreateSampleInput, DgaSample } from '@/types';
import type { DeltaResult } from '@/lib/analysis';

export interface CreateAnalysisPayload {
  id?: string;
  sampleId: string;
  normProfile: AnalysisResult['normProfile'];
  o2n2Ratio?: number | null;
  status?: string | null;
  delta?: {
    h2Delta?: number | null;
    ch4Delta?: number | null;
    c2h6Delta?: number | null;
    c2h4Delta?: number | null;
    c2h2Delta?: number | null;
    coDelta?: number | null;
    co2Delta?: number | null;
  } | null;
}

export interface RunAnalysisResponse {
  sample: DgaSample;
  analysis: AnalysisResult;
}

export function deltaResultToScalars(delta: DeltaResult | null | undefined) {
  if (!delta) return null;
  return {
    h2Delta: delta.h2.delta,
    ch4Delta: delta.ch4.delta,
    c2h6Delta: delta.c2h6.delta,
    c2h4Delta: delta.c2h4.delta,
    c2h2Delta: delta.c2h2.delta,
    coDelta: delta.co.delta,
    co2Delta: delta.co2.delta,
  };
}

export async function fetchAnalysis(id: string): Promise<AnalysisResult> {
  return apiClient.get<AnalysisResult>(`/analysis/${id}`);
}

export async function createAnalysisApi(
  transformerId: string,
  payload: CreateAnalysisPayload,
): Promise<AnalysisResult> {
  return apiClient.post<AnalysisResult>(
    `/transformers/${transformerId}/analyses`,
    payload,
  );
}

export async function runAnalysisApi(
  transformerId: string,
  sample: Omit<CreateSampleInput, 'transformerId'>,
): Promise<RunAnalysisResponse> {
  return apiClient.post<RunAnalysisResponse>(
    `/transformers/${transformerId}/analyses/run`,
    { sample },
  );
}
