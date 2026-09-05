import type { Request, Response } from 'express';
import { auditLogService } from '../services/auditLog.service.js';
import type { AuditLogFilter } from '../types/index.js';

export class AuditLogController {
  async list(req: Request, res: Response) {
    const { userId, action, from, to, page } = req.query;
    const filter: AuditLogFilter = {
      userId: typeof userId === 'string' ? userId : undefined,
      action: typeof action === 'string' ? action : undefined,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
    };
    const pageNum = typeof page === 'string' ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const result = await auditLogService.list(filter, pageNum);
    res.json(result);
  }
}

export const auditLogController = new AuditLogController();
