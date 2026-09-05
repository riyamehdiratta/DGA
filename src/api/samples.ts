import { apiClient } from './client';
import type { CreateSampleInput, DgaSample } from '@/types';

export async function fetchSamplesForTransformer(
  transformerId: string,
): Promise<DgaSample[]> {
  return apiClient.get<DgaSample[]>(`/transformers/${transformerId}/samples`);
}

export async function fetchSample(id: string): Promise<DgaSample> {
  return apiClient.get<DgaSample>(`/samples/${id}`);
}

export async function createSampleApi(
  transformerId: string,
  input: CreateSampleInput,
  id?: string,
): Promise<DgaSample> {
  return apiClient.post<DgaSample>(`/transformers/${transformerId}/samples`, {
    ...input,
    ...(id ? { id } : {}),
  });
}
