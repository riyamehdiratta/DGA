import type { Request, Response } from 'express';
import { paramId } from '../middleware/params.js';
import { auditLogService } from '../services/auditLog.service.js';
import { backupService } from '../services/backup.service.js';

export class BackupController {
  async list(_req: Request, res: Response) {
    res.json(backupService.listBackups());
  }

  async create(req: Request, res: Response) {
    const backup = await backupService.createBackup();
    await auditLogService.record({
      userId: req.user!.id,
      action: 'backup.create',
      targetType: 'Backup',
      targetId: backup.filename,
      metadata: { sizeBytes: backup.sizeBytes },
    });
    res.status(201).json(backup);
  }

  async download(req: Request, res: Response) {
    const filename = paramId(req.params.filename);
    const filePath = backupService.resolveBackupPath(filename);
    await auditLogService.record({
      userId: req.user!.id,
      action: 'backup.download',
      targetType: 'Backup',
      targetId: filename,
    });
    res.download(filePath, filename);
  }
}

export const backupController = new BackupController();
