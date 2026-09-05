import { analysisRepository } from '../repositories/analysis.repository.js';
import { sampleRepository } from '../repositories/sample.repository.js';
import { transformerRepository } from '../repositories/transformer.repository.js';
import { NotFoundError } from '../types/errors.js';
import type { CreateSampleDto, DgaSampleDto } from '../types/index.js';
import { toSampleDto } from '../types/mappers.js';
import { validateSampleInput } from '../lib/validation/sample.js';

export class SampleService {
  async listAllSamples(): Promise<DgaSampleDto[]> {
    const samples = await sampleRepository.findAll();
    return samples.map(toSampleDto);
  }

  async listSamplesForTransformer(transformerId: string): Promise<DgaSampleDto[]> {
    const transformer = await transformerRepository.findById(transformerId);
    if (!transformer) {
      throw new NotFoundError('Transformer', transformerId);
    }

    const samples = await sampleRepository.findByTransformerId(transformerId);
    return samples.map(toSampleDto);
  }

  async getSample(id: string): Promise<DgaSampleDto> {
    const sample = await sampleRepository.findById(id);
    if (!sample) {
      throw new NotFoundError('Sample', id);
    }
    return toSampleDto(sample);
  }

  async createSample(
    transformerId: string,
    input: CreateSampleDto,
    id?: string,
  ): Promise<DgaSampleDto> {
    const transformer = await transformerRepository.findById(transformerId);
    if (!transformer) {
      throw new NotFoundError('Transformer', transformerId);
    }

    validateSampleInput(input);

    const sample = await sampleRepository.create(transformerId, input, id);
    return toSampleDto(sample);
  }

  async getPreviousSampleForAnalysis(sampleId: string) {
    const sample = await sampleRepository.findById(sampleId);
    if (!sample) {
      return null;
    }
    return sampleRepository.findPreviousSample(sample.transformerId, sample.sampleDate, sample.id);
  }
}

export const sampleService = new SampleService();
