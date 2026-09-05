import ExcelJS from 'exceljs';
import { sampleRepository } from '../repositories/sample.repository.js';
import { transformerRepository } from '../repositories/transformer.repository.js';
import { analysisService } from './analysis.service.js';
import { transformerService } from './transformer.service.js';
import { AppError, NotFoundError } from '../types/errors.js';
import type { CreateSampleDto } from '../types/index.js';
import { formatDate, toAnalysisDto } from '../types/mappers.js';
import { analysisRepository } from '../repositories/analysis.repository.js';

const TRANSFORMER_COLUMNS = [
  'transformerName',
  'serialNumber',
  'equipmentId',
  'substation',
  'manufacturer',
  'voltageRating',
  'mvaRating',
  'commissioningDate',
] as const;

const SAMPLE_COLUMNS = ['sampleDate', 'h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co', 'co2', 'o2', 'n2', 'remarks'] as const;

export interface ImportSummary {
  imported: number;
  errors: { row: number; message: string }[];
}

function headerRow(sheet: ExcelJS.Worksheet): string[] {
  const row = sheet.getRow(1);
  const headers: string[] = [];
  row.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '').trim();
  });
  return headers;
}

function cellString(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return formatDate(value);
  return String(value).trim();
}

function cellNumber(value: ExcelJS.CellValue): number | undefined {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export class ImportExportService {
  async exportTransformersXlsx(): Promise<Buffer> {
    const transformers = await transformerRepository.findAll();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transformers');
    sheet.addRow([...TRANSFORMER_COLUMNS]);
    for (const t of transformers) {
      sheet.addRow([
        t.transformerName,
        t.serialNumber,
        t.equipmentId,
        t.substation,
        t.manufacturer,
        t.voltageRating,
        t.mvaRating,
        formatDate(t.commissioningDate),
      ]);
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async importTransformersXlsx(buffer: Buffer): Promise<ImportSummary> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new AppError(400, 'Uploaded file has no worksheet');
    }

    const headers = headerRow(sheet);
    const summary: ImportSummary = { imported: 0, errors: [] };

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      if (row.actualCellCount === 0) continue;

      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = cellString(row.getCell(index + 1).value);
      });

      try {
        const missing = TRANSFORMER_COLUMNS.filter((col) => !record[col]);
        if (missing.length > 0) {
          throw new Error(`Missing required column(s): ${missing.join(', ')}`);
        }
        await transformerService.createTransformer({
          transformerName: record.transformerName,
          serialNumber: record.serialNumber,
          equipmentId: record.equipmentId,
          substation: record.substation,
          manufacturer: record.manufacturer,
          voltageRating: record.voltageRating,
          mvaRating: record.mvaRating,
          commissioningDate: record.commissioningDate,
        });
        summary.imported += 1;
      } catch (err) {
        summary.errors.push({ row: rowNumber, message: err instanceof Error ? err.message : String(err) });
      }
    }

    return summary;
  }

  async exportSamplesXlsx(transformerId: string): Promise<Buffer> {
    const transformer = await transformerRepository.findById(transformerId);
    if (!transformer) {
      throw new NotFoundError('Transformer', transformerId);
    }

    const samplesForTransformer = await sampleRepository.findByTransformerId(transformerId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Samples');
    sheet.addRow([...SAMPLE_COLUMNS]);
    for (const s of samplesForTransformer) {
      sheet.addRow([
        formatDate(s.sampleDate),
        s.h2,
        s.ch4,
        s.c2h6,
        s.c2h4,
        s.c2h2,
        s.co,
        s.co2,
        s.o2,
        s.n2,
        s.remarks,
      ]);
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async importSamplesXlsx(transformerId: string, buffer: Buffer): Promise<ImportSummary> {
    const transformer = await transformerRepository.findById(transformerId);
    if (!transformer) {
      throw new NotFoundError('Transformer', transformerId);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new AppError(400, 'Uploaded file has no worksheet');
    }

    const headers = headerRow(sheet);
    const summary: ImportSummary = { imported: 0, errors: [] };

    // Parsed first, then analyzed in sampleDate order (not file row order):
    // each sample's Delta/Rate depends on the transformer's prior samples by
    // date, so an out-of-order batch would otherwise compute those against
    // the wrong "previous" sample.
    const parsed: { rowNumber: number; input: CreateSampleDto }[] = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      if (row.actualCellCount === 0) continue;

      const record: Record<string, ExcelJS.CellValue> = {};
      headers.forEach((header, index) => {
        record[header] = row.getCell(index + 1).value;
      });

      const sampleDate = cellString(record.sampleDate);
      if (!sampleDate) {
        summary.errors.push({ row: rowNumber, message: 'Missing required column: sampleDate' });
        continue;
      }

      parsed.push({
        rowNumber,
        input: {
          sampleDate,
          h2: cellNumber(record.h2) ?? 0,
          ch4: cellNumber(record.ch4) ?? 0,
          c2h6: cellNumber(record.c2h6) ?? 0,
          c2h4: cellNumber(record.c2h4) ?? 0,
          c2h2: cellNumber(record.c2h2) ?? 0,
          co: cellNumber(record.co) ?? 0,
          co2: cellNumber(record.co2) ?? 0,
          o2: cellNumber(record.o2) ?? null,
          n2: cellNumber(record.n2) ?? null,
          remarks: cellString(record.remarks),
        },
      });
    }

    parsed.sort((a, b) => a.input.sampleDate.localeCompare(b.input.sampleDate));

    for (const { rowNumber, input } of parsed) {
      try {
        // Runs the full analysis pipeline (not a bare insert) so imported
        // samples show up analyzed, the same as a manually-entered one.
        await analysisService.runAnalysis(transformerId, { sample: input });
        summary.imported += 1;
      } catch (err) {
        summary.errors.push({ row: rowNumber, message: err instanceof Error ? err.message : String(err) });
      }
    }

    return summary;
  }

  async exportAnalysesXlsx(): Promise<Buffer> {
    const analyses = await analysisRepository.findAll();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Analyses');
    sheet.addRow(['id', 'transformerId', 'sampleId', 'sampleDate', 'normProfile', 'status', 'createdAt']);
    for (const a of analyses) {
      const dto = toAnalysisDto(a, a.sample, null, a.delta);
      sheet.addRow([
        dto.id,
        dto.transformerId,
        dto.sampleId,
        formatDate(a.sample.sampleDate),
        dto.normProfile,
        dto.status,
        dto.createdAt,
      ]);
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}

export const importExportService = new ImportExportService();
