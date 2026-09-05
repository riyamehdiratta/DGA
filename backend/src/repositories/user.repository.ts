import { prisma } from '../prisma/client.js';
import type { CreateUserInput, UpdateUserInput } from '../types/index.js';

export class UserRepository {
  findAll() {
    return prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  count() {
    return prisma.user.count();
  }

  create(input: CreateUserInput & { passwordHash: string }) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        designation: input.designation,
        substationType: input.substationType,
        substationArea: input.substationArea,
      },
    });
  }

  update(id: string, input: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data: input });
  }

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}

export const userRepository = new UserRepository();
