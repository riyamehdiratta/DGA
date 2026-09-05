import { apiClient } from './client';
import type {
  AppState,
  CreateTransformerInput,
  Transformer,
  UpdateTransformerInput,
} from '@/types';

type ApiTransformer = Transformer & { createdAt?: string; updatedAt?: string };

function toTransformer(transformer: ApiTransformer): Transformer {
  const { createdAt: _c, updatedAt: _u, ...rest } = transformer;
  return rest;
}

export async function fetchBootstrap(): Promise<AppState> {
  const data = await apiClient.get<{
    transformers: Array<Transformer & { createdAt?: string; updatedAt?: string }>;
    samples: AppState['samples'];
    analyses: AppState['analyses'];
  }>('/bootstrap');

  return {
    transformers: data.transformers.map(toTransformer),
    samples: data.samples,
    analyses: data.analyses,
  };
}

export async function fetchTransformers(): Promise<Transformer[]> {
  const transformers = await apiClient.get<ApiTransformer[]>('/transformers');
  return transformers.map(toTransformer);
}

export async function fetchTransformer(id: string): Promise<Transformer> {
  const transformer = await apiClient.get<ApiTransformer>(`/transformers/${id}`);
  return toTransformer(transformer);
}

export async function createTransformerApi(
  input: CreateTransformerInput,
): Promise<Transformer> {
  const transformer = await apiClient.post<ApiTransformer>('/transformers', input);
  return toTransformer(transformer);
}

export async function updateTransformerApi(
  id: string,
  input: UpdateTransformerInput,
): Promise<Transformer> {
  const transformer = await apiClient.put<ApiTransformer>(`/transformers/${id}`, input);
  return toTransformer(transformer);
}

export async function deleteTransformerApi(id: string): Promise<void> {
  return apiClient.delete(`/transformers/${id}`);
}
