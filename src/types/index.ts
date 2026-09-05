import type { DeltaAnalysisRow, DeltaResult, NormProfile } from '@/lib/analysis';

export type { DeltaAnalysisRow, DeltaResult, DeltaGas, NormProfile } from '@/lib/analysis';

/** IEEE C57.104-2019 status codes — see docs/IEEE_STATUS_LOGIC.md. */
export type DgaStatus = 'STATUS_1' | 'STATUS_2' | 'STATUS_3';

export interface ExceededThreshold {
  sourceTable: 'TABLE_1' | 'TABLE_2' | 'TABLE_3' | 'TABLE_4';
  gas: string;
  actualValue: number;
  thresholdValue: number | 'ANY_INCREASE' | 'ANY_INCREASING_RATE';
}

export interface StatusResult {
  status: DgaStatus;
  reasoning: string[];
  exceededThresholds: ExceededThreshold[];
}

export type GasKey = 'h2' | 'ch4' | 'c2h6' | 'c2h4' | 'c2h2' | 'co' | 'co2';

export type PeriodBucket = 'MONTHS_4_TO_9' | 'MONTHS_10_TO_24';

export interface RateGasValues {
  h2: number | null;
  ch4: number | null;
  c2h6: number | null;
  c2h4: number | null;
  c2h2: number | null;
  co: number | null;
  co2: number | null;
}

export interface RateExceededThreshold {
  sourceTable: 'TABLE_4';
  gas: string;
  actualValue: number;
  thresholdValue: number | 'ANY_INCREASING_RATE';
}

export interface RateResult {
  periodDays: number;
  periodBucket: PeriodBucket | null;
  rates: RateGasValues;
  exceededThresholds: RateExceededThreshold[];
  rateAvailable: boolean;
}

export type KeyGasDiagnosis =
  | 'THERMAL_OIL'
  | 'THERMAL_CELLULOSE'
  | 'PARTIAL_DISCHARGE'
  | 'ARCING'
  | 'INCONCLUSIVE';

export type KeyGasConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface KeyGasResult {
  diagnosis: KeyGasDiagnosis;
  dominantGas: GasKey | null;
  confidence: KeyGasConfidence;
  reasoning: string[];
}

export type DoernenburgDiagnosis =
  | 'THERMAL_DECOMPOSITION'
  | 'CORONA'
  | 'ARCING'
  | 'INCONCLUSIVE';

export interface DoernenburgRatios {
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
}

export interface DoernenburgResult {
  diagnosis: DoernenburgDiagnosis;
  ratios: DoernenburgRatios;
  reasoning: string[];
}

export type DuvalTriangle1Zone = 'PD' | 'T1' | 'T2' | 'T3' | 'DT' | 'D1' | 'D2';

export interface DuvalTriangle1Result {
  zone: DuvalTriangle1Zone | 'UNCLASSIFIED' | null;
  percentages: { ch4: number; c2h4: number; c2h2: number } | null;
  warnings: string[];
  reasoning: string[];
}

export type DuvalTriangle4Zone = 'PD' | 'S' | 'O' | 'C' | 'ND';

export interface DuvalTriangle4Result {
  zone: DuvalTriangle4Zone | 'UNCLASSIFIED' | null;
  percentages: { h2: number; ch4: number; c2h6: number } | null;
  warnings: string[];
  reasoning: string[];
}

export type DuvalTriangle5Zone = 'PD' | 'O' | 'S' | 'T2' | 'T3' | 'C' | 'ND';

export interface DuvalTriangle5Result {
  zone: DuvalTriangle5Zone | 'UNCLASSIFIED' | null;
  percentages: { ch4: number; c2h4: number; c2h6: number } | null;
  warnings: string[];
  reasoning: string[];
}

export interface DuvalTriangleResult {
  triangle1: DuvalTriangle1Result;
  triangle4: DuvalTriangle4Result | null;
  triangle5: DuvalTriangle5Result | null;
}

export interface DuvalPentagonCoordinate {
  x: number;
  y: number;
}

export type DuvalPentagon1Zone = 'PD' | 'D1' | 'D2' | 'T1' | 'T2' | 'T3' | 'S';

export interface DuvalPentagon1Result {
  diagnosis: DuvalPentagon1Zone | 'OUTSIDE' | null;
  coordinates: DuvalPentagonCoordinate | null;
  reasoning: string[];
}

export type DuvalPentagon2Zone = 'PD' | 'D1' | 'D2' | 'S' | 'O' | 'C' | 'T3-H';

export interface DuvalPentagon2Result {
  diagnosis: DuvalPentagon2Zone | 'OUTSIDE' | null;
  coordinates: DuvalPentagonCoordinate | null;
  reasoning: string[];
  matchedZone: DuvalPentagon2Zone | null;
}

export type RecommendationTier = 'ROUTINE' | 'MONITOR' | 'INVESTIGATE' | 'URGENT' | 'EXTREME';

export interface RecommendationResult {
  tier: RecommendationTier;
  actions: string[];
  reasoning: string[];
}

export interface AnalysisResult {
  id: string;
  transformerId: string;
  sampleId: string;
  createdAt: string;

  normProfile: NormProfile;
  o2n2Ratio: number | null;

  status?: DgaStatus | null;
  statusResult?: StatusResult | null;
  delta?: DeltaResult | null;
  rateResult?: RateResult | null;
  keyGasResult?: KeyGasResult | null;
  doernenburgResult?: DoernenburgResult | null;
  duvalTriangleResult?: DuvalTriangleResult | null;
  duvalPentagon1Result?: DuvalPentagon1Result | null;
  duvalPentagon2Result?: DuvalPentagon2Result | null;
  recommendationResult?: RecommendationResult | null;
}

export interface Transformer {
  id: string;
  transformerName: string;
  serialNumber: string;
  equipmentId: string;
  substation: string;
  manufacturer: string;
  voltageRating: string;
  mvaRating: string;
  commissioningDate: string;
}

export interface DgaSample {
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
  /** Optional — null when not measured or not provided. */
  o2: number | null;
  /** Optional — null when not measured or not provided. */
  n2: number | null;
  remarks: string;
}

export interface AppState {
  transformers: Transformer[];
  samples: DgaSample[];
  analyses: AnalysisResult[];
}

export type CreateTransformerInput = Omit<Transformer, 'id'>;
export type UpdateTransformerInput = Partial<CreateTransformerInput>;
export type CreateSampleInput = Omit<DgaSample, 'id'>;
export type CreateAnalysisInput = Omit<AnalysisResult, 'id' | 'createdAt'>;
export interface TransformerSummary {
  transformer: Transformer;
  lastStatus: DgaStatus | 'Pending';
  lastSampleDate: string | null;
  lastAnalysisId: string | null;
}

export interface SampleHistoryRow {
  id: string;
  sampleId: string;
  sampleDate: string;
  status: DgaStatus | 'Pending';
  diagnosis: string;
  analysisId: string | null;
}

export interface AnalysisHistoryRow {
  id: string;
  date: string;
  transformerId: string;
  transformerName: string;
  substation: string;
  status: DgaStatus | 'Pending';
  diagnosis: string;
}

export interface DashboardStats {
  totalTransformers: number;
  samplesThisMonth: number;
  pendingReview: number;
  criticalAlerts: number;
}

export interface TrendDataPoint {
  date: string;
  h2: number;
  ch4: number;
  c2h2: number;
  co: number;
}

export interface StatusTrendDataPoint {
  date: string;
  statusValue: number;
}

export interface ReportSummary {
  id: string;
  reportNo: string;
  analysisId: string;
  transformerId: string;
  transformerName: string;
  substation: string;
  sampleDate: string;
  generatedDate: string;
}

export interface ReportSection {
  title: string;
  /** Key-value rows, rendered as a two-column table. */
  rows?: { label: string; value: string }[];
  /** Free-text lead-in shown above rows/table/list, e.g. a status summary line. */
  note?: string;
  /** Bulleted list, e.g. recommended actions. */
  list?: string[];
  /** Multi-column table, e.g. threshold exceedances. */
  table?: { headers: string[]; rows: string[][] };
  /** Shown instead of rows/table/list when there's nothing to report (e.g. no exceedances). */
  emptyMessage?: string;
  /** Trailing italic caveat, shown below rows/table/list — e.g. the mandatory expert-judgment note. */
  footnote?: string;
}

export interface AnalysisResultDetail {
  result: AnalysisResult;
  transformer: Transformer;
  sample: DgaSample;
  summary: {
    overallStatus: DgaStatus | 'Pending';
    keyFindings: string[];
    o2n2Ratio: string;
    normProfile: NormProfile;
  };
  deltaAnalysis: DeltaAnalysisRow[];
  isBaselineSample: boolean;
  rateAnalysis: { gas: string; rate: string; classification: string }[];
  diagnosticMethods: { method: string; result: string; faultType: string }[];
  duvalTriangle: DuvalTriangleResult | null;
  duvalPentagon1: DuvalPentagon1Result | null;
  duvalPentagon2: DuvalPentagon2Result | null;
  recommendation: RecommendationResult | null;
}

export interface NavItem {
  label: string;
  path: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

export type SampleFormInput = Omit<DgaSample, 'id' | 'transformerId'>;

export const GAS_FIELDS = [
  'h2',
  'ch4',
  'c2h6',
  'c2h4',
  'c2h2',
  'co',
  'co2',
  'o2',
  'n2',
] as const;

export type GasField = (typeof GAS_FIELDS)[number];

export type UserRole = 'ADMIN' | 'ENGINEER';

export interface AuthUser {
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

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AdminDashboardData {
  counts: { transformers: number; samples: number; analyses: number; users: number };
  recentActivity: AuditLogEntry[];
}

export interface BackupFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export interface SystemHealth {
  database: { status: 'ok' | 'error'; sizeBytes: number | null; version: string | null };
  api: { status: 'ok' };
  uptimeSeconds: number;
  appVersion: string;
  nodeVersion: string;
  environment: string;
}

export interface ImportSummary {
  imported: number;
  errors: { row: number; message: string }[];
}

export function createEmptyTransformerInput(): CreateTransformerInput {
  return {
    transformerName: '',
    serialNumber: '',
    equipmentId: '',
    substation: '',
    manufacturer: '',
    voltageRating: '',
    mvaRating: '',
    commissioningDate: '',
  };
}
