import { analysisRepository } from '../repositories/analysis.repository.js';
import { sampleRepository } from '../repositories/sample.repository.js';
import { transformerRepository } from '../repositories/transformer.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditLogService } from './auditLog.service.js';
import type { AdminDashboardDto } from '../types/index.js';

export class AdminDashboardService {
  async getDashboard(): Promise<AdminDashboardDto> {
    const [transformers, samples, analyses, users, recentActivity] = await Promise.all([
      transformerRepository.count(),
      sampleRepository.count(),
      analysisRepository.count(),
      userRepository.count(),
      auditLogService.recent(10),
    ]);

    return {
      counts: { transformers, samples, analyses, users },
      recentActivity,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
