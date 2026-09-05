import { auditLogRepository } from '../repositories/auditLog.repository.js';
import type { AuditLogDto, AuditLogFilter } from '../types/index.js';
import { toAuditLogDto } from '../types/mappers.js';

export interface RecordAuditLogInput {
  userId: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: unknown;
}

export class AuditLogService {
  async record(entry: RecordAuditLogInput): Promise<void> {
    await auditLogRepository.create(entry);
  }

  async recent(limit = 10): Promise<AuditLogDto[]> {
    const logs = await auditLogRepository.findRecent(limit);
    return logs.map(toAuditLogDto);
  }

  async list(
    filter: AuditLogFilter,
    page: number,
  ): Promise<{ items: AuditLogDto[]; total: number; page: number; pageSize: number }> {
    const result = await auditLogRepository.findPaginated(filter, page);
    return { ...result, items: result.items.map(toAuditLogDto) };
  }
}

export const auditLogService = new AuditLogService();
