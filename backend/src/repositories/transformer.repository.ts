import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import type { CreateTransformerDto, UpdateTransformerDto } from '../types/index.js';
import { parseDate } from '../types/mappers.js';

export class TransformerRepository {
  findAll() {
    return prisma.transformer.findMany({ orderBy: { transformerName: 'asc' } });
  }

  findById(id: string) {
    return prisma.transformer.findUnique({ where: { id } });
  }

  count() {
    return prisma.transformer.count();
  }

  create(input: CreateTransformerDto) {
    return prisma.transformer.create({
      data: {
        ...input,
        commissioningDate: parseDate(input.commissioningDate),
      },
    });
  }

  update(id: string, input: UpdateTransformerDto) {
    const data: Prisma.TransformerUpdateInput = { ...input };
    if (input.commissioningDate) {
      data.commissioningDate = parseDate(input.commissioningDate);
    }
    return prisma.transformer.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.transformer.delete({ where: { id } });
  }
}

export const transformerRepository = new TransformerRepository();
