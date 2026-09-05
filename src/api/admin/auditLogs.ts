import { apiClient } from '@/api/client';
import type { AuditLogEntry } from '@/types';

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogPage> {
  const params = new URLSearchParams();
  if (filter.userId) params.set('userId', filter.userId);
  if (filter.action) params.set('action', filter.action);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  if (filter.page) params.set('page', String(filter.page));

  const query = params.toString();
  return apiClient.get<AuditLogPage>(`/admin/audit-logs${query ? `?${query}` : ''}`);
}
