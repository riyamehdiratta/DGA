import type { Request, Response } from 'express';
import { systemHealthService } from '../services/systemHealth.service.js';

export class SystemHealthController {
  async get(_req: Request, res: Response) {
    const health = await systemHealthService.check();
    res.json(health);
  }
}

export const systemHealthController = new SystemHealthController();
