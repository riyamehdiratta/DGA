import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import type { AuditLogFilter } from '../types/index.js';

const PAGE_SIZE = 50;

export class AuditLogRepository {
  create(entry: {
    userId: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: unknown;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findRecent(limit: number) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { email: true } } },
    });
  }

  async findPaginated(filter: AuditLogFilter, page: number) {
    const where: Prisma.AuditLogWhereInput = {
      userId: filter.userId,
      action: filter.action,
      createdAt: {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined,
      },
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize: PAGE_SIZE };
  }
}

export const auditLogRepository = new AuditLogRepository();
