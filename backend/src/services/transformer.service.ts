import { transformerRepository } from '../repositories/transformer.repository.js';
import { NotFoundError } from '../types/errors.js';
import type {
  CreateTransformerDto,
  TransformerDto,
  UpdateTransformerDto,
} from '../types/index.js';
import { toTransformerDto } from '../types/mappers.js';

export class TransformerService {
  async listTransformers(): Promise<TransformerDto[]> {
    const transformers = await transformerRepository.findAll();
    return transformers.map(toTransformerDto);
  }

  async getTransformer(id: string): Promise<TransformerDto> {
    const transformer = await transformerRepository.findById(id);
    if (!transformer) {
      throw new NotFoundError('Transformer', id);
    }
    return toTransformerDto(transformer);
  }

  async createTransformer(input: CreateTransformerDto): Promise<TransformerDto> {
    const transformer = await transformerRepository.create(input);
    return toTransformerDto(transformer);
  }

  async updateTransformer(
    id: string,
    input: UpdateTransformerDto,
  ): Promise<TransformerDto> {
    await this.getTransformer(id);
    const transformer = await transformerRepository.update(id, input);
    return toTransformerDto(transformer);
  }

  async deleteTransformer(id: string): Promise<void> {
    await this.getTransformer(id);
    await transformerRepository.delete(id);
  }
}

export const transformerService = new TransformerService();
