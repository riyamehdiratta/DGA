import type { Request, Response } from 'express';
import { parseSandboxGasInput } from '../lib/validation/sandbox.js';
import { learnService } from '../services/learn.service.js';

export class LearnController {
  async sandbox(req: Request, res: Response) {
    const sample = parseSandboxGasInput(req.body);
    res.json(learnService.runSandbox(sample));
  }
}

export const learnController = new LearnController();
