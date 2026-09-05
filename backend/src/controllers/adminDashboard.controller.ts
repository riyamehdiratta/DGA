import type { Request, Response } from 'express';
import { adminDashboardService } from '../services/adminDashboard.service.js';

export class AdminDashboardController {
  async get(_req: Request, res: Response) {
    const dashboard = await adminDashboardService.getDashboard();
    res.json(dashboard);
  }
}

export const adminDashboardController = new AdminDashboardController();
