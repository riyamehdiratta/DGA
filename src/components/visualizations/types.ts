/** Shared visualization types — extend when IEEE calculations are implemented. */

export interface TrendPoint {
  date: string;
  value: number;
}

export interface MultiGasTrendPoint {
  date: string;
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
}

export interface O2N2TrendPoint {
  date: string;
  o2: number;
  n2: number;
  ratio: number;
}

export interface RatioTrendPoint {
  date: string;
  ch4h2: number;
  c2h2c2h4: number;
  c2h4c2h6: number;
}

export interface GasBarEntry {
  gas: string;
  value: number;
  unit?: string;
}

export type { DuvalPentagonCoordinate } from '@/types';

export const PENDING_ANALYSIS = 'Pending Analysis' as const;
