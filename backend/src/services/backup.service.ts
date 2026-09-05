import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { AppError, NotFoundError } from '../types/errors.js';
import type { BackupFileDto } from '../types/index.js';

const execFileAsync = promisify(execFile);

function backupDir(): string {
  const dir = process.env.BACKUP_DIR ?? path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

// Prisma's DATABASE_URL uses a `schema` query parameter that libpq (and so
// pg_dump) doesn't understand ("invalid URI query parameter: schema") -
// strip it before handing the connection string to pg_dump.
function pgDumpConnectionString(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.delete('schema');
  return url.toString();
}

// Intentionally read-only: this service can create and read backups, but
// has no restore method. Restoring the database is a deliberately
// out-of-band operation performed directly against Postgres, so a
// compromised or misclicked browser session can never wipe production data.
export class BackupService {
  async createBackup(): Promise<BackupFileDto> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new AppError(500, 'DATABASE_URL is not configured');
    }

    const filename = `dga_backup_${timestamp()}.sql`;
    const filePath = path.join(backupDir(), filename);

    await execFileAsync('pg_dump', [
      '-d',
      pgDumpConnectionString(databaseUrl),
      '--clean',
      '--if-exists',
      '-f',
      filePath,
    ]);

    const stats = fs.statSync(filePath);
    return { filename, sizeBytes: stats.size, createdAt: stats.birthtime.toISOString() };
  }

  listBackups(): BackupFileDto[] {
    const dir = backupDir();
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .map((filename) => {
        const stats = fs.statSync(path.join(dir, filename));
        return { filename, sizeBytes: stats.size, createdAt: stats.birthtime.toISOString() };
      })
      // Sorted by filename (embeds a lexicographically-sortable timestamp),
      // not filesystem birthtime - birthtime resolution isn't fine-grained
      // enough to reliably order two backups created moments apart.
      .sort((a, b) => b.filename.localeCompare(a.filename));
  }

  resolveBackupPath(filename: string): string {
    const safeName = path.basename(filename);
    const dir = backupDir();
    const filePath = path.join(dir, safeName);
    if (!filePath.startsWith(dir) || !fs.existsSync(filePath)) {
      throw new NotFoundError('Backup', filename);
    }
    return filePath;
  }
}

export const backupService = new BackupService();
