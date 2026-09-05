import type { AnalysisResult, AuditLog, DgaSample, DeltaResult, Transformer, User } from '@prisma/client';
import type {
  AnalysisResultDto,
  AuditLogDto,
  DeltaResultDto,
  DgaSampleDto,
  DoernenburgResultDto,
  DuvalPentagon1ResultDto,
  DuvalPentagon2ResultDto,
  DuvalTriangleResultDto,
  KeyGasResultDto,
  NormProfile,
  RateResultDto,
  RecommendationResultDto,
  StatusResultDto,
  TransformerDto,
  UserDto,
  UserRole,
} from '../types/index.js';

const DELTA_GAS_KEYS = ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co', 'co2'] as const;

type DeltaGasKey = (typeof DELTA_GAS_KEYS)[number];

type GasSample = Pick<DgaSample, DeltaGasKey>;

type DeltaScalarField =
  | 'h2Delta'
  | 'ch4Delta'
  | 'c2h6Delta'
  | 'c2h4Delta'
  | 'c2h2Delta'
  | 'coDelta'
  | 'co2Delta';

const DELTA_FIELD_MAP: Record<DeltaGasKey, DeltaScalarField> = {
  h2: 'h2Delta',
  ch4: 'ch4Delta',
  c2h6: 'c2h6Delta',
  c2h4: 'c2h4Delta',
  c2h2: 'c2h2Delta',
  co: 'coDelta',
  co2: 'co2Delta',
};

export function formatDate(value: Date): string {
  return value.toISOString().split('T')[0];
}

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toTransformerDto(transformer: Transformer): TransformerDto {
  return {
    id: transformer.id,
    transformerName: transformer.transformerName,
    serialNumber: transformer.serialNumber,
    equipmentId: transformer.equipmentId,
    substation: transformer.substation,
    manufacturer: transformer.manufacturer,
    voltageRating: transformer.voltageRating,
    mvaRating: transformer.mvaRating,
    commissioningDate: formatDate(transformer.commissioningDate),
    createdAt: transformer.createdAt.toISOString(),
    updatedAt: transformer.updatedAt.toISOString(),
  };
}

export function toSampleDto(sample: DgaSample): DgaSampleDto {
  return {
    id: sample.id,
    transformerId: sample.transformerId,
    sampleDate: formatDate(sample.sampleDate),
    h2: sample.h2,
    ch4: sample.ch4,
    c2h6: sample.c2h6,
    c2h4: sample.c2h4,
    c2h2: sample.c2h2,
    co: sample.co,
    co2: sample.co2,
    o2: sample.o2,
    n2: sample.n2,
    remarks: sample.remarks,
    createdAt: sample.createdAt.toISOString(),
  };
}

export function buildDeltaDto(
  currentSample: GasSample,
  previousSample: GasSample | null,
  deltaRecord: DeltaResult | null,
): DeltaResultDto | null {
  if (!deltaRecord) {
    return null;
  }

  return DELTA_GAS_KEYS.reduce((result, key) => {
    const previous = previousSample ? previousSample[key] : null;
    const current = currentSample[key];
    const deltaField = DELTA_FIELD_MAP[key];
    const storedDelta = deltaRecord[deltaField];

    result[key] = {
      previous,
      current,
      delta: storedDelta ?? null,
    };
    return result;
  }, {} as DeltaResultDto);
}

export function toAnalysisDto(
  analysis: AnalysisResult,
  sample: DgaSample,
  previousSample: DgaSample | null,
  deltaRecord: DeltaResult | null,
): AnalysisResultDto {
  return {
    id: analysis.id,
    transformerId: analysis.transformerId,
    sampleId: analysis.sampleId,
    normProfile: analysis.normProfile as NormProfile,
    o2n2Ratio: analysis.o2n2Ratio,
    status: (analysis.status as AnalysisResultDto['status']) ?? null,
    statusResult: analysis.statusResult as StatusResultDto | null,
    delta: buildDeltaDto(sample, previousSample, deltaRecord),
    rateResult: analysis.rateResult as RateResultDto | null,
    keyGasResult: analysis.keyGasResult as KeyGasResultDto | null,
    doernenburgResult: analysis.doernenburgResult as DoernenburgResultDto | null,
    duvalTriangleResult: analysis.duvalTriangleResult as DuvalTriangleResultDto | null,
    duvalPentagon1Result: analysis.duvalPentagon1Result as DuvalPentagon1ResultDto | null,
    duvalPentagon2Result: analysis.duvalPentagon2Result as DuvalPentagon2ResultDto | null,
    recommendationResult: analysis.recommendationResult as RecommendationResultDto | null,
    createdAt: analysis.createdAt.toISOString(),
  };
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    designation: user.designation,
    substationType: user.substationType,
    substationArea: user.substationArea,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAuditLogDto(log: AuditLog & { user?: Pick<User, 'email'> | null }): AuditLogDto {
  return {
    id: log.id,
    userId: log.userId,
    userEmail: log.user?.email ?? null,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
  };
}
