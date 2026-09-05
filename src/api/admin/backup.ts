import { apiClient } from '@/api/client';
import { downloadFile } from '@/api/admin/shared';
import type { BackupFile } from '@/types';

export async function fetchBackups(): Promise<BackupFile[]> {
  return apiClient.get<BackupFile[]>('/admin/backups');
}

export async function createBackup(): Promise<BackupFile> {
  return apiClient.post<BackupFile>('/admin/backups', {});
}

export async function downloadBackup(filename: string): Promise<void> {
  return downloadFile(`/admin/backups/${encodeURIComponent(filename)}/download`, filename);
}
