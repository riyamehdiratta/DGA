import type { Request, Response } from 'express';
import { paramId } from '../middleware/params.js';
import { analysisService } from '../services/analysis.service.js';
import { auditLogService } from '../services/auditLog.service.js';
import type { CreateAnalysisDto, RunAnalysisDto } from '../types/index.js';

export class AnalysisController {
  async bootstrap(_req: Request, res: Response) {
    const data = await analysisService.bootstrap();
    res.json(data);
  }

  async list(_req: Request, res: Response) {
    const analyses = await analysisService.listAnalyses();
    res.json(analyses);
  }

  async getById(req: Request, res: Response) {
    const analysis = await analysisService.getAnalysis(paramId(req.params.id));
    res.json(analysis);
  }

  async exportXlsx(req: Request, res: Response) {
    const id = paramId(req.params.id);
    const buffer = await analysisService.exportDtlXlsxReport(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="DGA-Report-${id}.xlsx"`);
    res.send(buffer);
  }

  async create(req: Request, res: Response) {
    const analysis = await analysisService.createAnalysis(
      paramId(req.params.id),
      req.body as CreateAnalysisDto,
    );
    await auditLogService.record({
      userId: req.user!.id,
      action: 'analysis.create',
      targetType: 'AnalysisResult',
      targetId: analysis.id,
    });
    res.status(201).json(analysis);
  }

  async run(req: Request, res: Response) {
    const result = await analysisService.runAnalysis(
      paramId(req.params.id),
      req.body as RunAnalysisDto,
    );
    await auditLogService.record({
      userId: req.user!.id,
      action: 'analysis.run',
      targetType: 'AnalysisResult',
      targetId: result.analysis.id,
    });
    res.status(201).json(result);
  }
}

export const analysisController = new AnalysisController();
