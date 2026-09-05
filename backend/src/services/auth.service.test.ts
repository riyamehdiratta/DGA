import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '../types/errors.js';

vi.mock('../repositories/user.repository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
  },
}));

const { userRepository } = await import('../repositories/user.repository.js');
const { authService } = await import('./auth.service.js');

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'engineer@dga.local',
    passwordHash: '',
    role: 'ENGINEER',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('authService.login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('succeeds with the correct password and returns a UserDto (no passwordHash)', async () => {
    const passwordHash = await bcrypt.hash('correct-horse', 12);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash }) as never);

    const result = await authService.login('engineer@dga.local', 'correct-horse');

    expect(result).toEqual({
      id: 'user-1',
      email: 'engineer@dga.local',
      role: 'ENGINEER',
      isActive: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct-horse', 12);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash }) as never);

    await expect(authService.login('engineer@dga.local', 'wrong-password')).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rejects an unknown email with the same error as a wrong password (no user enumeration)', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(authService.login('nobody@dga.local', 'anything')).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rejects a disabled user even with the correct password', async () => {
    const passwordHash = await bcrypt.hash('correct-horse', 12);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      makeUser({ passwordHash, isActive: false }) as never,
    );

    await expect(authService.login('engineer@dga.local', 'correct-horse')).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
