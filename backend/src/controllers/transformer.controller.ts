import type { Request, Response } from 'express';
import { paramId } from '../middleware/params.js';
import { auditLogService } from '../services/auditLog.service.js';
import { transformerService } from '../services/transformer.service.js';
import type { CreateTransformerDto, UpdateTransformerDto } from '../types/index.js';

export class TransformerController {
  async list(_req: Request, res: Response) {
    const transformers = await transformerService.listTransformers();
    res.json(transformers);
  }

  async getById(req: Request, res: Response) {
    const transformer = await transformerService.getTransformer(paramId(req.params.id));
    res.json(transformer);
  }

  async create(req: Request, res: Response) {
    const transformer = await transformerService.createTransformer(
      req.body as CreateTransformerDto,
    );
    await auditLogService.record({
      userId: req.user!.id,
      action: 'transformer.create',
      targetType: 'Transformer',
      targetId: transformer.id,
    });
    res.status(201).json(transformer);
  }

  async update(req: Request, res: Response) {
    const id = paramId(req.params.id);
    const transformer = await transformerService.updateTransformer(
      id,
      req.body as UpdateTransformerDto,
    );
    await auditLogService.record({
      userId: req.user!.id,
      action: 'transformer.update',
      targetType: 'Transformer',
      targetId: id,
    });
    res.json(transformer);
  }

  async remove(req: Request, res: Response) {
    const id = paramId(req.params.id);
    await transformerService.deleteTransformer(id);
    await auditLogService.record({
      userId: req.user!.id,
      action: 'transformer.delete',
      targetType: 'Transformer',
      targetId: id,
    });
    res.status(204).send();
  }
}

export const transformerController = new TransformerController();
