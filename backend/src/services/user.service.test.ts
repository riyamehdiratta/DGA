import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError, NotFoundError } from '../types/errors.js';

vi.mock('../repositories/user.repository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

const { userRepository } = await import('../repositories/user.repository.js');
const { userService } = await import('./user.service.js');

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'admin@dga.local',
    passwordHash: 'hash',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('userService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createUser', () => {
    it('rejects a duplicate email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser() as never);

      await expect(
        userService.createUser({ email: 'admin@dga.local', password: 'x', role: 'ENGINEER' }),
      ).rejects.toThrow(AppError);
    });

    it('hashes the password before storing it', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(makeUser({ role: 'ENGINEER' }) as never);

      await userService.createUser({ email: 'new@dga.local', password: 'plaintext', role: 'ENGINEER' });

      const call = vi.mocked(userRepository.create).mock.calls[0][0];
      expect(call.passwordHash).not.toBe('plaintext');
      expect(typeof call.passwordHash).toBe('string');
    });
  });

  describe('updateUser', () => {
    it('throws NotFoundError for a missing user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(userService.updateUser('missing', {}, 'actor-1')).rejects.toThrow(NotFoundError);
    });

    it('refuses to let an admin disable their own account', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(makeUser({ id: 'actor-1' }) as never);

      await expect(
        userService.updateUser('actor-1', { isActive: false }, 'actor-1'),
      ).rejects.toThrow(AppError);
    });

    it('refuses to let an admin demote their own account to Engineer', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(makeUser({ id: 'actor-1' }) as never);

      await expect(
        userService.updateUser('actor-1', { role: 'ENGINEER' }, 'actor-1'),
      ).rejects.toThrow(AppError);
    });

    it('allows an admin to disable a different user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(makeUser({ id: 'user-2' }) as never);
      vi.mocked(userRepository.update).mockResolvedValue(
        makeUser({ id: 'user-2', isActive: false }) as never,
      );

      const result = await userService.updateUser('user-2', { isActive: false }, 'actor-1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('throws NotFoundError for a missing user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(userService.resetPassword('missing', 'new-password')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
