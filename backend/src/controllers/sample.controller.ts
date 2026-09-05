import type { Request, Response } from 'express';
import { paramId } from '../middleware/params.js';
import { auditLogService } from '../services/auditLog.service.js';
import { sampleService } from '../services/sample.service.js';
import type { CreateSampleDto } from '../types/index.js';

export class SampleController {
  async listAll(_req: Request, res: Response) {
    const samples = await sampleService.listAllSamples();
    res.json(samples);
  }

  async listByTransformer(req: Request, res: Response) {
    const samples = await sampleService.listSamplesForTransformer(paramId(req.params.id));
    res.json(samples);
  }

  async getById(req: Request, res: Response) {
    const sample = await sampleService.getSample(paramId(req.params.id));
    res.json(sample);
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateSampleDto & { id?: string };
    const { id, ...input } = body;
    const sample = await sampleService.createSample(paramId(req.params.id), input, id);
    await auditLogService.record({
      userId: req.user!.id,
      action: 'sample.create',
      targetType: 'DgaSample',
      targetId: sample.id,
    });
    res.status(201).json(sample);
  }
}

export const sampleController = new SampleController();
