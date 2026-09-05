import type { Request, Response } from 'express';
import { paramId } from '../middleware/params.js';
import { auditLogService } from '../services/auditLog.service.js';
import { importExportService } from '../services/importExport.service.js';
import { AppError } from '../types/errors.js';

function xlsxHeaders(res: Response, filename: string) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

function requireUploadedFile(req: Request): Buffer {
  const file = req.file;
  if (!file) {
    throw new AppError(400, 'No file uploaded');
  }
  return file.buffer;
}

export class ImportExportController {
  async exportTransformers(_req: Request, res: Response) {
    const buffer = await importExportService.exportTransformersXlsx();
    xlsxHeaders(res, 'transformers.xlsx');
    res.send(buffer);
  }

  async importTransformers(req: Request, res: Response) {
    const summary = await importExportService.importTransformersXlsx(requireUploadedFile(req));
    await auditLogService.record({
      userId: req.user!.id,
      action: 'transformer.import',
      targetType: 'Transformer',
      metadata: summary,
    });
    res.json(summary);
  }

  async exportSamples(req: Request, res: Response) {
    const transformerId = paramId(req.params.transformerId);
    const buffer = await importExportService.exportSamplesXlsx(transformerId);
    xlsxHeaders(res, `samples-${transformerId}.xlsx`);
    res.send(buffer);
  }

  async importSamples(req: Request, res: Response) {
    const transformerId = paramId(req.params.transformerId);
    const summary = await importExportService.importSamplesXlsx(transformerId, requireUploadedFile(req));
    await auditLogService.record({
      userId: req.user!.id,
      action: 'sample.import',
      targetType: 'Transformer',
      targetId: transformerId,
      metadata: summary,
    });
    res.json(summary);
  }

  async exportAnalyses(_req: Request, res: Response) {
    const buffer = await importExportService.exportAnalysesXlsx();
    xlsxHeaders(res, 'analyses.xlsx');
    res.send(buffer);
  }
}

export const importExportController = new ImportExportController();
