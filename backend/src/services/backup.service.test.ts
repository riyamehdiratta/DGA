import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../types/errors.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dga-backup-test-'));
  process.env.BACKUP_DIR = tmpDir;
});

afterEach(() => {
  delete process.env.BACKUP_DIR;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('backupService', () => {
  it('has no restore method - restoring the database must go through the CLI, never the API', async () => {
    const { backupService } = await import('./backup.service.js');
    expect((backupService as unknown as Record<string, unknown>).restore).toBeUndefined();
    expect((backupService as unknown as Record<string, unknown>).restoreBackup).toBeUndefined();
  });

  it('lists existing backup files newest-first', async () => {
    const { backupService } = await import('./backup.service.js');
    fs.writeFileSync(path.join(tmpDir, 'dga_backup_2026-01-01_00-00-00.sql'), 'old');
    fs.writeFileSync(path.join(tmpDir, 'dga_backup_2026-06-01_00-00-00.sql'), 'new');

    const backups = backupService.listBackups();

    expect(backups).toHaveLength(2);
    expect(backups[0].filename).toBe('dga_backup_2026-06-01_00-00-00.sql');
  });

  it('resolves a real backup file by name', async () => {
    const { backupService } = await import('./backup.service.js');
    fs.writeFileSync(path.join(tmpDir, 'dga_backup_2026-01-01_00-00-00.sql'), 'contents');

    const resolved = backupService.resolveBackupPath('dga_backup_2026-01-01_00-00-00.sql');
    expect(resolved).toBe(path.join(tmpDir, 'dga_backup_2026-01-01_00-00-00.sql'));
  });

  it('rejects a path-traversal filename instead of escaping the backup directory', async () => {
    const { backupService } = await import('./backup.service.js');
    expect(() => backupService.resolveBackupPath('../../etc/passwd')).toThrow(NotFoundError);
  });

  it('rejects a filename that does not exist', async () => {
    const { backupService } = await import('./backup.service.js');
    expect(() => backupService.resolveBackupPath('does-not-exist.sql')).toThrow(NotFoundError);
  });
});

describe('pgDumpConnectionString (via createBackup argument building)', () => {
  // pg_dump / libpq rejects Prisma's `schema` query parameter with
  // "invalid URI query parameter: schema" - createBackup must strip it
  // before shelling out. Exercised indirectly by spying on execFile,
  // since the function itself isn't exported.
  it('strips the Prisma-only schema query parameter before invoking pg_dump', async () => {
    vi.resetModules();
    const execFileMock = vi.fn((_cmd: string, _args: string[], cb: (err: Error | null) => void) => {
      cb(null);
    });
    vi.doMock('node:child_process', () => ({ execFile: execFileMock }));
    process.env.DATABASE_URL = 'postgresql://dga:secret@127.0.0.1:5433/dga_analysis?schema=public';

    const { backupService } = await import('./backup.service.js');
    const originalStatSync = fs.statSync;
    fs.statSync = () => ({ size: 1, birthtime: new Date() }) as fs.Stats;

    try {
      await backupService.createBackup();
    } finally {
      fs.statSync = originalStatSync;
      delete process.env.DATABASE_URL;
    }

    const [, args] = execFileMock.mock.calls[0] as [string, string[]];
    const dumpUrl = args[args.indexOf('-d') + 1];
    expect(dumpUrl).not.toContain('schema');
    expect(dumpUrl).toContain('dga_analysis');
  });
});
