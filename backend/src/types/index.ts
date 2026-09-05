import type {
  RateResult,
  KeyGasResult,
  DoernenburgResult,
  DuvalTriangleEngineResult,
  DuvalPentagon1Result,
  DuvalPentagon2Result,
  RecommendationResult,
} from '../lib/analysis/index.js';

export type NormProfile = 'LOW_RATIO' | 'HIGH_RATIO' | 'DEFAULT_HIGH_RATIO';

export type DgaStatus = 'STATUS_1' | 'STATUS_2' | 'STATUS_3';

export interface ExceededThresholdDto {
  sourceTable: 'TABLE_1' | 'TABLE_2' | 'TABLE_3' | 'TABLE_4';
  gas: string;
  actualValue: number;
  thresholdValue: number | 'ANY_INCREASE' | 'ANY_INCREASING_RATE';
}

export interface StatusResultDto {
  status: DgaStatus;
  reasoning: string[];
  exceededThresholds: ExceededThresholdDto[];
}

export type RateResultDto = RateResult;
export type KeyGasResultDto = KeyGasResult;
export type DoernenburgResultDto = DoernenburgResult;
export type DuvalTriangleResultDto = DuvalTriangleEngineResult;
export type DuvalPentagon1ResultDto = DuvalPentagon1Result;
export type DuvalPentagon2ResultDto = DuvalPentagon2Result;
export type RecommendationResultDto = RecommendationResult;

/** Input for the stateless Learn sandbox — the seven gas concentrations in ppm. */
export interface SandboxGasInputDto {
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
}

/**
 * Result of a stateless Learn sandbox run: only the gas-only engines
 * (Key Gas, Doernenburg, Duval Triangle/Pentagon) — no Status/Rate/Delta/
 * Recommendation, which require sample history and a transformer.
 */
export interface SandboxRunResponseDto {
  keyGas: KeyGasResultDto;
  doernenburg: DoernenburgResultDto;
  duvalTriangle: DuvalTriangleResultDto;
  duvalPentagon1: DuvalPentagon1ResultDto;
  duvalPentagon2: DuvalPentagon2ResultDto;
}

export interface TransformerDto {
  id: string;
  transformerName: string;
  serialNumber: string;
  equipmentId: string;
  substation: string;
  manufacturer: string;
  voltageRating: string;
  mvaRating: string;
  commissioningDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransformerDto {
  transformerName: string;
  serialNumber: string;
  equipmentId: string;
  substation: string;
  manufacturer: string;
  voltageRating: string;
  mvaRating: string;
  commissioningDate: string;
}

export type UpdateTransformerDto = Partial<CreateTransformerDto>;

export interface DgaSampleDto {
  id: string;
  transformerId: string;
  sampleDate: string;
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
  o2: number | null;
  n2: number | null;
  remarks: string;
  createdAt: string;
}

export interface CreateSampleDto {
  sampleDate: string;
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
  o2?: number | null;
  n2?: number | null;
  remarks?: string;
}

export interface DeltaGasDto {
  previous: number | null;
  current: number;
  delta: number | null;
}

export interface DeltaResultDto {
  h2: DeltaGasDto;
  ch4: DeltaGasDto;
  c2h6: DeltaGasDto;
  c2h4: DeltaGasDto;
  c2h2: DeltaGasDto;
  co: DeltaGasDto;
  co2: DeltaGasDto;
}

export interface AnalysisResultDto {
  id: string;
  transformerId: string;
  sampleId: string;
  normProfile: NormProfile;
  o2n2Ratio: number | null;
  status: DgaStatus | null;
  statusResult: StatusResultDto | null;
  delta: DeltaResultDto | null;
  rateResult: RateResultDto | null;
  keyGasResult: KeyGasResultDto | null;
  doernenburgResult: DoernenburgResultDto | null;
  duvalTriangleResult: DuvalTriangleResultDto | null;
  duvalPentagon1Result: DuvalPentagon1ResultDto | null;
  duvalPentagon2Result: DuvalPentagon2ResultDto | null;
  recommendationResult: RecommendationResultDto | null;
  createdAt: string;
}

export interface CreateAnalysisDto {
  id?: string;
  sampleId: string;
  normProfile: NormProfile;
  o2n2Ratio?: number | null;
  status?: string | null;
  delta?: {
    h2Delta?: number | null;
    ch4Delta?: number | null;
    c2h6Delta?: number | null;
    c2h4Delta?: number | null;
    c2h2Delta?: number | null;
    coDelta?: number | null;
    co2Delta?: number | null;
  } | null;
}

export interface RunAnalysisDto {
  sample: CreateSampleDto;
}

export interface RunAnalysisResponseDto {
  sample: DgaSampleDto;
  analysis: AnalysisResultDto;
}

export interface AppBootstrapDto {
  transformers: TransformerDto[];
  samples: DgaSampleDto[];
  analyses: AnalysisResultDto[];
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export type UserRole = 'ADMIN' | 'ENGINEER';

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  designation: string | null;
  substationType: string | null;
  substationArea: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Public registration always creates an engineer account. */
export interface SignupInput {
  email: string;
  password: string;
  designation: string;
  substationType: string;
  substationArea: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  designation?: string;
  substationType?: string;
  substationArea?: string;
}

export interface UpdateUserInput {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ResetPasswordInput {
  password: string;
}

export interface AuditLogDto {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export interface AdminDashboardDto {
  counts: {
    transformers: number;
    samples: number;
    analyses: number;
    users: number;
  };
  recentActivity: AuditLogDto[];
}

export interface BackupFileDto {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export interface SystemHealthDto {
  database: { status: 'ok' | 'error'; sizeBytes: number | null; version: string | null };
  api: { status: 'ok' };
  uptimeSeconds: number;
  appVersion: string;
  nodeVersion: string;
  environment: string;
}
