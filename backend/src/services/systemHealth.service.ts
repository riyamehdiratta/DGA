import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../prisma/client.js';
import type { SystemHealthDto } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_JSON_PATH = path.resolve(__dirname, '../../package.json');

function appVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export class SystemHealthService {
  async check(): Promise<SystemHealthDto> {
    let database: SystemHealthDto['database'] = { status: 'error', sizeBytes: null, version: null };
    try {
      const [sizeRow] = await prisma.$queryRaw<{ size: bigint }[]>`
        SELECT pg_database_size(current_database()) AS size
      `;
      const [versionRow] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
      database = {
        status: 'ok',
        sizeBytes: sizeRow ? Number(sizeRow.size) : null,
        version: versionRow?.version ?? null,
      };
    } catch {
      // database stays in its 'error' default state
    }

    return {
      database,
      api: { status: 'ok' },
      uptimeSeconds: process.uptime(),
      appVersion: appVersion(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}

export const systemHealthService = new SystemHealthService();
