import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { deltaResultToScalars, runAnalysisPipeline } from '../lib/analysis/index.js';
import type { CreateAnalysisDto, CreateSampleDto } from '../types/index.js';
import { parseDate } from '../types/mappers.js';

function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export class AnalysisRepository {
  count() {
    return prisma.analysisResult.count();
  }

  findAll() {
    return prisma.analysisResult.findMany({
      include: {
        sample: true,
        delta: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.analysisResult.findUnique({
      where: { id },
      include: {
        sample: true,
        delta: true,
      },
    });
  }

  findBySampleId(sampleId: string) {
    return prisma.analysisResult.findUnique({
      where: { sampleId },
      include: {
        sample: true,
        delta: true,
      },
    });
  }

  create(transformerId: string, input: CreateAnalysisDto) {
    return prisma.$transaction(async (tx) => {
      const analysis = await tx.analysisResult.create({
        data: {
          ...(input.id ? { id: input.id } : {}),
          transformerId,
          sampleId: input.sampleId,
          normProfile: input.normProfile,
          o2n2Ratio: input.o2n2Ratio ?? null,
          status: input.status ?? null,
        },
      });

      if (input.delta) {
        await tx.deltaResult.create({
          data: {
            analysisId: analysis.id,
            h2Delta: input.delta.h2Delta ?? null,
            ch4Delta: input.delta.ch4Delta ?? null,
            c2h6Delta: input.delta.c2h6Delta ?? null,
            c2h4Delta: input.delta.c2h4Delta ?? null,
            c2h2Delta: input.delta.c2h2Delta ?? null,
            coDelta: input.delta.coDelta ?? null,
            co2Delta: input.delta.co2Delta ?? null,
          },
        });
      }

      return tx.analysisResult.findUniqueOrThrow({
        where: { id: analysis.id },
        include: {
          sample: true,
          delta: true,
        },
      });
    });
  }

  runAnalysis(transformerId: string, sampleInput: CreateSampleDto) {
    return prisma.$transaction(async (tx) => {
      const transformer = await tx.transformer.findUnique({ where: { id: transformerId } });
      if (!transformer) {
        return null;
      }

      const sampleDate = parseDate(sampleInput.sampleDate);
      const sample = await tx.dgaSample.create({
        data: {
          transformerId,
          sampleDate,
          h2: sampleInput.h2,
          ch4: sampleInput.ch4,
          c2h6: sampleInput.c2h6,
          c2h4: sampleInput.c2h4,
          c2h2: sampleInput.c2h2,
          co: sampleInput.co,
          co2: sampleInput.co2,
          o2: sampleInput.o2 ?? null,
          n2: sampleInput.n2 ?? null,
          remarks: sampleInput.remarks ?? '',
        },
      });

      // Up to 5 prior samples, most-recent-first: combined with the current
      // sample this gives the Rate Engine its full 6-sample maximum window.
      const previousSamples = await tx.dgaSample.findMany({
        where: {
          transformerId,
          sampleDate: { lt: sampleDate },
          id: { not: sample.id },
        },
        orderBy: { sampleDate: 'desc' },
        take: 5,
      });

      const pipeline = runAnalysisPipeline(
        sample,
        previousSamples,
        transformer.commissioningDate,
        sampleDate,
      );
      const deltaScalars = deltaResultToScalars(pipeline.delta);

      const analysis = await tx.analysisResult.create({
        data: {
          transformerId,
          sampleId: sample.id,
          normProfile: pipeline.normProfile,
          o2n2Ratio: pipeline.o2n2Ratio,
          status: pipeline.status,
          statusResult: toJson(pipeline.statusResult),
          rateResult: toJson(pipeline.rate),
          keyGasResult: toJson(pipeline.keyGas),
          doernenburgResult: toJson(pipeline.doernenburg),
          duvalTriangleResult: toJson(pipeline.duvalTriangle),
          duvalPentagon1Result: toJson(pipeline.duvalPentagon1),
          duvalPentagon2Result: toJson(pipeline.duvalPentagon2),
          recommendationResult: toJson(pipeline.recommendation),
        },
      });

      await tx.deltaResult.create({
        data: {
          analysisId: analysis.id,
          ...deltaScalars,
        },
      });

      return tx.analysisResult.findUniqueOrThrow({
        where: { id: analysis.id },
        include: {
          sample: true,
          delta: true,
        },
      });
    });
  }
}

export const analysisRepository = new AnalysisRepository();
