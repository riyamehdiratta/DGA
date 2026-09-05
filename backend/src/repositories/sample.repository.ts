import { prisma } from '../prisma/client.js';
import type { CreateSampleDto } from '../types/index.js';
import { parseDate } from '../types/mappers.js';

export class SampleRepository {
  findAll() {
    return prisma.dgaSample.findMany({ orderBy: { sampleDate: 'desc' } });
  }

  findById(id: string) {
    return prisma.dgaSample.findUnique({ where: { id } });
  }

  count() {
    return prisma.dgaSample.count();
  }

  findByTransformerId(transformerId: string) {
    return prisma.dgaSample.findMany({
      where: { transformerId },
      orderBy: { sampleDate: 'desc' },
    });
  }

  findPreviousSample(transformerId: string, sampleDate: Date, excludeId?: string) {
    return prisma.dgaSample.findFirst({
      where: {
        transformerId,
        sampleDate: { lt: sampleDate },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { sampleDate: 'desc' },
    });
  }

  create(transformerId: string, input: CreateSampleDto, id?: string) {
    return prisma.dgaSample.create({
      data: {
        ...(id ? { id } : {}),
        transformerId,
        sampleDate: parseDate(input.sampleDate),
        h2: input.h2,
        ch4: input.ch4,
        c2h6: input.c2h6,
        c2h4: input.c2h4,
        c2h2: input.c2h2,
        co: input.co,
        co2: input.co2,
        o2: input.o2 ?? null,
        n2: input.n2 ?? null,
        remarks: input.remarks ?? '',
      },
    });
  }
}

export const sampleRepository = new SampleRepository();
