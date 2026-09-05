import type {
  AppState,
  AnalysisResult,
  AnalysisResultDetail,
  AnalysisHistoryRow,
  DashboardStats,
  DgaSample,
  DgaStatus,
  ReportSection,
  ReportSummary,
  SampleHistoryRow,
  StatusTrendDataPoint,
  Transformer,
  TransformerSummary,
  TrendDataPoint,
} from '@/types';
import type {
  GasBarEntry,
  MultiGasTrendPoint,
  O2N2TrendPoint,
  RatioTrendPoint,
} from '@/components/visualizations/types';
import {
  formatDgaStatus,
  formatO2N2Ratio,
  formatThresholdActual,
  formatThresholdLimit,
  formatThresholdSource,
  getDisplayDiagnosis,
  getFaultZoneDiagnosis,
  isAnalysisPending,
  parseDgaStatus,
  deltaResultToRows,
  hasDeltaComparison,
  runDeltaEngine,
  DELTA_GAS_KEYS,
  DELTA_GAS_LABELS,
} from '@/lib/analysis';

const STATUS_VALUES: Record<DgaStatus, number> = {
  STATUS_1: 1,
  STATUS_2: 2,
  STATUS_3: 3,
};

export function getTransformerById(
  state: AppState,
  id: string,
): Transformer | undefined {
  return state.transformers.find((t) => t.id === id);
}

export function getSampleById(
  state: AppState,
  id: string,
): DgaSample | undefined {
  return state.samples.find((s) => s.id === id);
}

export function getAnalysisById(
  state: AppState,
  id: string,
): AnalysisResult | undefined {
  return state.analyses.find((a) => a.id === id);
}

export function getAnalysisForSample(
  state: AppState,
  sampleId: string,
): AnalysisResult | undefined {
  return state.analyses.find((a) => a.sampleId === sampleId);
}

export function getSamplesByTransformerId(
  state: AppState,
  transformerId: string,
): DgaSample[] {
  return state.samples
    .filter((s) => s.transformerId === transformerId)
    .sort((a, b) => b.sampleDate.localeCompare(a.sampleDate));
}

export function getAnalysesByTransformerId(
  state: AppState,
  transformerId: string,
): AnalysisResult[] {
  return state.analyses
    .filter((a) => a.transformerId === transformerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLatestAnalysisForTransformer(
  state: AppState,
  transformerId: string,
): AnalysisResult | undefined {
  return getAnalysesByTransformerId(state, transformerId)[0];
}

export function getTransformerSummary(
  state: AppState,
  transformerId: string,
): TransformerSummary | null {
  const transformer = getTransformerById(state, transformerId);
  if (!transformer) return null;

  const latestAnalysis = getLatestAnalysisForTransformer(state, transformerId);
  const samples = getSamplesByTransformerId(state, transformerId);
  const latestSample = samples[0];

  return {
    transformer,
    lastStatus: parseDgaStatus(latestAnalysis?.status),
    lastSampleDate: latestSample?.sampleDate ?? null,
    lastAnalysisId: latestAnalysis?.id ?? null,
  };
}

export function getAllTransformerSummaries(state: AppState): TransformerSummary[] {
  return state.transformers.map((transformer) => {
    const summary = getTransformerSummary(state, transformer.id);
    return summary!;
  });
}

export function getSubstations(state: AppState): string[] {
  return [...new Set(state.transformers.map((t) => t.substation))]
    .filter(Boolean)
    .sort();
}

export function getSampleHistoryRows(
  state: AppState,
  transformerId: string,
): SampleHistoryRow[] {
  return getSamplesByTransformerId(state, transformerId).map((sample) => {
    const analysis = getAnalysisForSample(state, sample.id);
    return {
      id: sample.id,
      sampleId: sample.id,
      sampleDate: sample.sampleDate,
      status: analysis ? parseDgaStatus(analysis.status) : 'Pending',
      diagnosis: analysis ? getDisplayDiagnosis(analysis) : 'Not analyzed',
      analysisId: analysis?.id ?? null,
    };
  });
}

export function getAnalysisHistoryRows(state: AppState): AnalysisHistoryRow[] {
  return state.analyses
    .map((analysis) => {
      const transformer = getTransformerById(state, analysis.transformerId);
      if (!transformer) return null;

      return {
        id: analysis.id,
        date: analysis.createdAt.split('T')[0],
        transformerId: analysis.transformerId,
        transformerName: transformer.transformerName,
        substation: transformer.substation,
        status: parseDgaStatus(analysis.status),
        diagnosis: getDisplayDiagnosis(analysis),
      };
    })
    .filter((row): row is AnalysisHistoryRow => row !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDashboardStats(state: AppState): DashboardStats {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const samplesThisMonth = state.samples.filter((s) => {
    const d = new Date(s.sampleDate);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  const pendingReview = state.analyses.filter(isAnalysisPending).length;

  // Count transformers currently in STATUS_3 (by their latest analysis),
  // not every historical STATUS_3 occurrence — the tile is labeled
  // "requires immediate attention," which only makes sense as a current,
  // open-issue count, not a lifetime tally including resolved history.
  const criticalAlerts = state.transformers.filter(
    (t) => getLatestAnalysisForTransformer(state, t.id)?.status === 'STATUS_3',
  ).length;

  return {
    totalTransformers: state.transformers.length,
    samplesThisMonth,
    pendingReview,
    criticalAlerts,
  };
}

export function getGasTrendData(
  state: AppState,
  transformerId: string,
): TrendDataPoint[] {
  return getSamplesByTransformerId(state, transformerId)
    .slice()
    .reverse()
    .map((sample) => ({
      date: sample.sampleDate.slice(0, 7),
      h2: sample.h2,
      ch4: sample.ch4,
      c2h2: sample.c2h2,
      co: sample.co,
    }));
}

export function getStatusTrendData(
  state: AppState,
  transformerId: string,
): StatusTrendDataPoint[] {
  const samples = getSamplesByTransformerId(state, transformerId).slice().reverse();

  return samples.map((sample) => {
    const analysis = getAnalysisForSample(state, sample.id);
    const status = parseDgaStatus(analysis?.status);
    return {
      date: sample.sampleDate.slice(0, 7),
      statusValue: status === 'Pending' ? 0 : STATUS_VALUES[status],
    };
  });
}

export function getMultiGasTrendData(
  state: AppState,
  transformerId: string,
): MultiGasTrendPoint[] {
  return getSamplesByTransformerId(state, transformerId)
    .slice()
    .reverse()
    .map((sample) => ({
      date: sample.sampleDate,
      h2: sample.h2,
      ch4: sample.ch4,
      c2h6: sample.c2h6,
      c2h4: sample.c2h4,
      c2h2: sample.c2h2,
      co: sample.co,
      co2: sample.co2,
    }));
}

export function getO2N2TrendData(
  state: AppState,
  transformerId: string,
): O2N2TrendPoint[] {
  return getSamplesByTransformerId(state, transformerId)
    .slice()
    .reverse()
    .filter((sample) => sample.o2 != null && sample.n2 != null)
    .map((sample) => {
      const analysis = getAnalysisForSample(state, sample.id);
      // o2/n2 are non-null due to the filter above.
      const o2 = sample.o2 as number;
      const n2 = sample.n2 as number;
      return {
        date: sample.sampleDate,
        o2,
        n2,
        ratio: analysis?.o2n2Ratio ?? o2 / n2,
      };
    });
}

/**
 * Classic three-ratio trend (CH4/H2, C2H2/C2H4, C2H4/C2H6) for charting purposes only —
 * plain arithmetic on raw sample concentrations, no threshold/zone interpretation attached.
 * Not a diagnostic verdict, so this doesn't need a backend engine.
 */
export function getRatioTrendData(
  state: AppState,
  transformerId: string,
): RatioTrendPoint[] {
  return getSamplesByTransformerId(state, transformerId)
    .slice()
    .reverse()
    .map((sample) => ({
      date: sample.sampleDate,
      ch4h2: sample.h2 === 0 ? 0 : sample.ch4 / sample.h2,
      c2h2c2h4: sample.c2h4 === 0 ? 0 : sample.c2h2 / sample.c2h4,
      c2h4c2h6: sample.c2h6 === 0 ? 0 : sample.c2h4 / sample.c2h6,
    }));
}

export function getCurrentGasBarData(sample: DgaSample): GasBarEntry[] {
  return DELTA_GAS_KEYS.map((key) => ({
    gas: DELTA_GAS_LABELS[key],
    value: sample[key],
    unit: 'ppm',
  }));
}

export function getReportSummaries(state: AppState): ReportSummary[] {
  return getAnalysisHistoryRows(state).map((row) => {
    const sample = getSamplesByTransformerId(state, row.transformerId).find(
      (s) => getAnalysisForSample(state, s.id)?.id === row.id,
    );

    return {
      id: row.id.replace('AN-', 'RPT-'),
      reportNo: row.id.replace('AN-', 'RPT-'),
      analysisId: row.id,
      transformerId: row.transformerId,
      transformerName: row.transformerName,
      substation: row.substation,
      sampleDate: sample?.sampleDate ?? row.date,
      generatedDate: row.date,
    };
  });
}

export function buildReportSections(
  transformer: Transformer,
  sample: DgaSample,
  analysis: AnalysisResult,
): ReportSection[] {
  return [
    {
      title: 'Transformer Information',
      rows: [
        { label: 'Transformer Name', value: transformer.transformerName },
        { label: 'Serial Number', value: transformer.serialNumber },
        { label: 'Equipment ID', value: transformer.equipmentId },
        { label: 'Manufacturer', value: transformer.manufacturer },
        { label: 'Voltage Rating', value: transformer.voltageRating },
        { label: 'MVA Rating', value: transformer.mvaRating },
        { label: 'Substation', value: transformer.substation },
      ],
    },
    {
      title: 'Sample Data',
      rows: [
        { label: 'Sample Date', value: sample.sampleDate },
        { label: 'H2 (ppm)', value: String(sample.h2) },
        { label: 'CH4 (ppm)', value: String(sample.ch4) },
        { label: 'C2H6 (ppm)', value: String(sample.c2h6) },
        { label: 'C2H4 (ppm)', value: String(sample.c2h4) },
        { label: 'C2H2 (ppm)', value: String(sample.c2h2) },
        { label: 'CO (ppm)', value: String(sample.co) },
        { label: 'CO2 (ppm)', value: String(sample.co2) },
        { label: 'O2 (ppm)', value: sample.o2 == null ? '—' : String(sample.o2) },
        { label: 'N2 (ppm)', value: sample.n2 == null ? '—' : String(sample.n2) },
      ],
    },
    {
      title: 'Diagnosis',
      rows: [
        { label: 'DGA Status', value: formatDgaStatus(parseDgaStatus(analysis.status)) },
        { label: 'Fault Diagnosis', value: getFaultZoneDiagnosis(analysis) ?? 'Not classified' },
        { label: 'Recommendation Tier', value: analysis.recommendationResult?.tier ?? 'Pending' },
        { label: 'Analyzed', value: analysis.createdAt.split('T')[0] },
      ],
    },
    {
      title: 'Why This Diagnosis — IEEE C57.104-2019 Threshold Exceedances',
      ...(analysis.statusResult && analysis.statusResult.exceededThresholds.length > 0
        ? {
            table: {
              headers: ['Source', 'Gas', 'Actual', 'Limit'],
              rows: analysis.statusResult.exceededThresholds.map((t) => [
                formatThresholdSource(t),
                t.gas,
                formatThresholdActual(t),
                formatThresholdLimit(t),
              ]),
            },
          }
        : {
            emptyMessage: analysis.statusResult
              ? 'No thresholds exceeded — all gas levels, deltas, and rates are within their applicable IEEE limits.'
              : 'No status reasoning is stored for this analysis.',
          }),
    },
    {
      title: 'Recommended Actions',
      ...(analysis.recommendationResult
        ? {
            list: analysis.recommendationResult.actions,
            // The mandatory expert-judgment caveat is always the last reasoning
            // entry the Recommendation Engine produces (DGA_RECOMMENDATIONS.md).
            footnote: analysis.recommendationResult.reasoning.at(-1),
          }
        : { emptyMessage: 'No recommendation is stored for this analysis.' }),
    },
  ];
}

export function buildAnalysisResultDetail(
  state: AppState,
  analysisId: string,
): AnalysisResultDetail | null {
  const result = getAnalysisById(state, analysisId);
  if (!result) return null;

  const transformer = getTransformerById(state, result.transformerId);
  const sample = getSampleById(state, result.sampleId);
  if (!transformer || !sample) return null;

  const delta = result.delta ?? runDeltaEngine(sample, null);
  const deltaAnalysis = deltaResultToRows(delta);
  const isBaselineSample = !hasDeltaComparison(delta);

  const o2n2Ratio = formatO2N2Ratio(result.o2n2Ratio);

  const rate = result.rateResult;
  const rateAnalysis =
    rate && rate.rateAvailable
      ? DELTA_GAS_KEYS.map((key) => {
          const value = rate.rates[key];
          // Backend threshold entries carry display names ('H2'), not gas keys ('h2').
          const exceeded = rate.exceededThresholds.some((t) => t.gas === DELTA_GAS_LABELS[key]);
          return {
            gas: DELTA_GAS_LABELS[key],
            rate: value == null ? '—' : `${value.toFixed(1)} ppm/yr`,
            classification: exceeded ? 'Elevated' : 'Normal',
          };
        })
      : [];

  const keyGas = result.keyGasResult;
  const doernenburg = result.doernenburgResult;
  const diagnosticMethods = [
    {
      method: 'Key Gas Method',
      result: keyGas ? keyGas.diagnosis : '—',
      faultType: keyGas?.dominantGas ?? '—',
    },
    {
      method: 'Doernenburg Ratio',
      result: doernenburg ? doernenburg.diagnosis : '—',
      faultType: doernenburg ? doernenburg.diagnosis : '—',
    },
  ];

  return {
    result,
    transformer,
    sample,
    summary: {
      overallStatus: parseDgaStatus(result.status),
      keyFindings: [
        getDisplayDiagnosis(result),
        ...(result.recommendationResult?.reasoning ?? []),
      ],
      o2n2Ratio,
      normProfile: result.normProfile,
    },
    deltaAnalysis,
    isBaselineSample,
    rateAnalysis,
    diagnosticMethods,
    duvalTriangle: result.duvalTriangleResult ?? null,
    duvalPentagon1: result.duvalPentagon1Result ?? null,
    duvalPentagon2: result.duvalPentagon2Result ?? null,
    recommendation: result.recommendationResult ?? null,
  };
}
