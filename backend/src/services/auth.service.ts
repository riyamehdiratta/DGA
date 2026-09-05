import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { AppError, UnauthorizedError } from '../types/errors.js';
import type { SignupInput, UserDto } from '../types/index.js';
import { toUserDto } from '../types/mappers.js';

const SALT_ROUNDS = 12;

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async login(email: string, password: string): Promise<UserDto> {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return toUserDto(user);
  }

  async signup(input: SignupInput): Promise<UserDto> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.designation.trim() || !input.substationType || !input.substationArea) {
      throw new AppError(400, 'Complete all required signup fields');
    }
    if (input.password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters');
    }
    if (await userRepository.findByEmail(email)) {
      throw new AppError(409, 'An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(input.password);
    const user = await userRepository.create({
      email,
      password: input.password,
      passwordHash,
      role: 'ENGINEER',
      designation: input.designation.trim(),
      substationType: input.substationType,
      substationArea: input.substationArea,
    });
    return toUserDto(user);
  }

  async getUser(id: string): Promise<UserDto> {
    const user = await userRepository.findById(id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError();
    }
    return toUserDto(user);
  }
}

export const authService = new AuthService();
