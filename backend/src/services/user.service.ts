import { userRepository } from '../repositories/user.repository.js';
import { authService } from './auth.service.js';
import { AppError, NotFoundError } from '../types/errors.js';
import type { CreateUserInput, UpdateUserInput, UserDto } from '../types/index.js';
import { toUserDto } from '../types/mappers.js';

export class UserService {
  async listUsers(): Promise<UserDto[]> {
    const users = await userRepository.findAll();
    return users.map(toUserDto);
  }

  async createUser(input: CreateUserInput): Promise<UserDto> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, `A user with email ${input.email} already exists`);
    }
    const passwordHash = await authService.hashPassword(input.password);
    const user = await userRepository.create({ ...input, passwordHash });
    return toUserDto(user);
  }

  async updateUser(id: string, input: UpdateUserInput, actingUserId: string): Promise<UserDto> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User', id);
    }
    if (id === actingUserId && (input.isActive === false || input.role === 'ENGINEER')) {
      throw new AppError(400, 'You cannot disable or demote your own account');
    }
    const user = await userRepository.update(id, input);
    return toUserDto(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<UserDto> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User', id);
    }
    const passwordHash = await authService.hashPassword(newPassword);
    const user = await userRepository.updatePassword(id, passwordHash);
    return toUserDto(user);
  }
}

export const userService = new UserService();
