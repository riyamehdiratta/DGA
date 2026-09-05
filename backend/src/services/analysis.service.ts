import { analysisRepository } from '../repositories/analysis.repository.js';
import { sampleRepository } from '../repositories/sample.repository.js';
import { transformerRepository } from '../repositories/transformer.repository.js';
import { AppError, NotFoundError } from '../types/errors.js';
import type {
  AnalysisResultDto,
  AppBootstrapDto,
  CreateAnalysisDto,
  RunAnalysisDto,
  RunAnalysisResponseDto,
} from '../types/index.js';
import { toAnalysisDto, toSampleDto, toTransformerDto } from '../types/mappers.js';
import { transformerService } from './transformer.service.js';
import { sampleService } from './sample.service.js';
import { resolveTransformerAgeCategory } from '../lib/analysis/status.js';
import { buildDtlDgaReportWorkbook } from '../lib/reports/dtlDgaReport.js';
import { validateSampleInput } from '../lib/validation/sample.js';

export class AnalysisService {
  async listAnalyses(): Promise<AnalysisResultDto[]> {
    const analyses = await analysisRepository.findAll();
    return Promise.all(
      analyses.map(async (analysis) => {
        const [previousSample, transformer] = await Promise.all([
          sampleRepository.findPreviousSample(
            analysis.sample.transformerId,
            analysis.sample.sampleDate,
            analysis.sample.id,
          ),
          transformerRepository.findById(analysis.sample.transformerId),
        ]);

        if (!transformer) {
          throw new NotFoundError('Transformer', analysis.sample.transformerId);
        }

        return toAnalysisDto(analysis, analysis.sample, previousSample, analysis.delta);
      }),
    );
  }

  async getAnalysis(id: string): Promise<AnalysisResultDto> {
    const analysis = await analysisRepository.findById(id);
    if (!analysis) {
      throw new NotFoundError('Analysis', id);
    }

    const [previousSample, transformer] = await Promise.all([
      sampleRepository.findPreviousSample(
        analysis.sample.transformerId,
        analysis.sample.sampleDate,
        analysis.sample.id,
      ),
      transformerRepository.findById(analysis.sample.transformerId),
    ]);

    if (!transformer) {
      throw new NotFoundError('Transformer', analysis.sample.transformerId);
    }

    return toAnalysisDto(analysis, analysis.sample, previousSample, analysis.delta);
  }

  /** Renders the DTL lab-report-format .xlsx export for a single analysis (see dtlDgaReport.ts). */
  async exportDtlXlsxReport(id: string): Promise<Buffer> {
    const analysis = await analysisRepository.findById(id);
    if (!analysis) {
      throw new NotFoundError('Analysis', id);
    }

    const [previousSample, transformer] = await Promise.all([
      sampleRepository.findPreviousSample(
        analysis.sample.transformerId,
        analysis.sample.sampleDate,
        analysis.sample.id,
      ),
      transformerRepository.findById(analysis.sample.transformerId),
    ]);

    if (!transformer) {
      throw new NotFoundError('Transformer', analysis.sample.transformerId);
    }

    const analysisDto = toAnalysisDto(analysis, analysis.sample, previousSample, analysis.delta);
    const ageCategory = resolveTransformerAgeCategory(
      transformer.commissioningDate,
      analysis.sample.sampleDate,
    );

    const workbook = await buildDtlDgaReportWorkbook({
      transformer: toTransformerDto(transformer),
      sample: toSampleDto(analysis.sample),
      previousSample: previousSample ? toSampleDto(previousSample) : null,
      analysis: analysisDto,
      ageCategory,
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async createAnalysis(
    transformerId: string,
    input: CreateAnalysisDto,
  ): Promise<AnalysisResultDto> {
    const transformer = await transformerRepository.findById(transformerId);
    if (!transformer) {
      throw new NotFoundError('Transformer', transformerId);
    }

    const sample = await sampleRepository.findById(input.sampleId);
    if (!sample || sample.transformerId !== transformerId) {
      throw new NotFoundError('Sample', input.sampleId);
    }

    const existing = await analysisRepository.findBySampleId(input.sampleId);
    if (existing) {
      throw new AppError(409, `Analysis already exists for sample: ${input.sampleId}`);
    }

    const created = await analysisRepository.create(transformerId, input);
    const previousSample = await sampleRepository.findPreviousSample(
      created.sample.transformerId,
      created.sample.sampleDate,
      created.sample.id,
    );

    return toAnalysisDto(created, created.sample, previousSample, created.delta);
  }

  async runAnalysis(
    transformerId: string,
    input: RunAnalysisDto,
  ): Promise<RunAnalysisResponseDto> {
    const transformer = await transformerRepository.findById(transformerId);
    if (!transformer) {
      throw new NotFoundError('Transformer', transformerId);
    }

    validateSampleInput(input.sample);

    const created = await analysisRepository.runAnalysis(transformerId, input.sample);
    if (!created) {
      throw new NotFoundError('Transformer', transformerId);
    }

    const previousSample = await sampleRepository.findPreviousSample(
      created.sample.transformerId,
      created.sample.sampleDate,
      created.sample.id,
    );

    return {
      sample: toSampleDto(created.sample),
      analysis: toAnalysisDto(created, created.sample, previousSample, created.delta),
    };
  }

  async bootstrap(): Promise<AppBootstrapDto> {
    const [transformers, samples, analyses] = await Promise.all([
      transformerService.listTransformers(),
      sampleService.listAllSamples(),
      this.listAnalyses(),
    ]);

    return { transformers, samples, analyses };
  }
}

export const analysisService = new AnalysisService();
