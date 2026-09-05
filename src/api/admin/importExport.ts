import { downloadFile, uploadFile } from '@/api/admin/shared';
import type { ImportSummary } from '@/types';

export async function exportTransformersXlsx(): Promise<void> {
  return downloadFile('/admin/import-export/transformers/export', 'transformers.xlsx');
}

export async function importTransformersXlsx(file: File): Promise<ImportSummary> {
  return uploadFile<ImportSummary>('/admin/import-export/transformers/import', file);
}

export async function exportSamplesXlsx(transformerId: string): Promise<void> {
  return downloadFile(
    `/admin/import-export/samples/${transformerId}/export`,
    `samples-${transformerId}.xlsx`,
  );
}

export async function importSamplesXlsx(transformerId: string, file: File): Promise<ImportSummary> {
  return uploadFile<ImportSummary>(`/admin/import-export/samples/${transformerId}/import`, file);
}

export async function exportAnalysesXlsx(): Promise<void> {
  return downloadFile('/admin/import-export/analyses/export', 'analyses.xlsx');
}
