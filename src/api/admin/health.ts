import { apiClient } from '@/api/client';
import type { SystemHealth } from '@/types';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  return apiClient.get<SystemHealth>('/admin/health');
}
