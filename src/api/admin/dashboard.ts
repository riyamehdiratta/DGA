import { apiClient } from '@/api/client';
import type { AdminDashboardData } from '@/types';

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return apiClient.get<AdminDashboardData>('/admin/dashboard');
}
