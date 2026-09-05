import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import {
  AnalysisHeader,
  AnalysisTimeline,
  DoernenburgCard,
  EngineSummary,
  KeyGasCard,
  OverallCondition,
  RecommendationPlan,
  ResponsibleGases,
  SampleReadings,
  WhyDiagnosis,
} from '@/components/analysis';
import {
  CurrentGasBarChart,
  DuvalPentagon1,
  DuvalPentagon2,
  DuvalTriangle1,
  DuvalTriangle4,
  DuvalTriangle5,
  GasTrendChart,
  O2N2TrendChart,
  RatioTrendChart,
} from '@/components/visualizations';
import {
  getCurrentGasBarData,
  getMultiGasTrendData,
  getO2N2TrendData,
  getRatioTrendData,
} from '@/lib/selectors';

const resultTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'recommendation', label: 'Recommendation' },
];

export function AnalysisResultPage() {
  const { id } = useParams<{ id: string }>();
  const { state, getAnalysisDetail } = useAppState();
  const detail = id ? getAnalysisDetail(id) : null;
  const [activeTab, setActiveTab] = useState('overview');

  if (!detail) {
    return (
      <div>
        <PageHeader title="Analysis Not Found" />
        <p className="text-sm text-gray-600">The requested analysis could not be found.</p>
        <Link to="/analysis/history" className="mt-4 inline-block text-sm underline">
          Back to Analysis History
        </Link>
      </div>
    );
  }

  const { result, transformer } = detail;

  const gasTrendData = getMultiGasTrendData(state, transformer.id);
  const o2n2TrendData = getO2N2TrendData(state, transformer.id);
  const ratioTrendData = getRatioTrendData(state, transformer.id);
  const currentGasData = getCurrentGasBarData(detail.sample);
  const exceededGases = [
    ...new Set((result.statusResult?.exceededThresholds ?? []).map((t) => t.gas)),
  ];

  const rateColumns = [
    { key: 'gas', header: 'Gas', render: (row: (typeof detail.rateAnalysis)[0]) => row.gas },
    {
      key: 'rate',
      header: 'Generation Rate',
      render: (row: (typeof detail.rateAnalysis)[0]) => (
        <span className="font-mono text-xs tabular-nums">{row.rate}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'classification',
      header: 'IEEE Table 4 Classification',
      render: (row: (typeof detail.rateAnalysis)[0]) => (
        <span className={row.classification === 'Elevated' ? 'font-semibold text-red-800' : ''}>
          {row.classification}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AnalysisHeader detail={detail} />
      <AnalysisTimeline transformerId={transformer.id} currentAnalysisId={result.id} />

      <Tabs tabs={resultTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div key={activeTab} className="anim-rise mt-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            <OverallCondition detail={detail} />
            <SampleReadings detail={detail} />
            <WhyDiagnosis detail={detail} />
            <ResponsibleGases detail={detail} />
          </>
        )}

        {activeTab === 'trends' && (
          <>
            <GasTrendChart data={gasTrendData} />
            <div className="grid gap-4 xl:grid-cols-2">
              <O2N2TrendChart data={o2n2TrendData} />
              <CurrentGasBarChart data={currentGasData} highlightGases={exceededGases} />
            </div>
            <RatioTrendChart data={ratioTrendData} />
            <Card title="Rate of Gas Generation — IEEE Table 4">
              {detail.rateAnalysis.length > 0 ? (
                <DataTable
                  columns={rateColumns}
                  data={detail.rateAnalysis}
                  getRowKey={(row) => row.gas}
                />
              ) : (
                <p className="text-sm text-gray-600">
                  Generation rates are unavailable — IEEE Table 4 requires at least 3 samples
                  within a valid window; this transformer does not have enough history yet.
                </p>
              )}
            </Card>
          </>
        )}

        {activeTab === 'diagnostics' && (
          <>
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                  Duval Diagnostics
                </h2>
                <p className="text-xs text-gray-500">
                  Markers plot the exact coordinates computed by the backend pipeline.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DuvalTriangle1 result={result.duvalTriangleResult?.triangle1 ?? null} />
                <DuvalTriangle4 result={result.duvalTriangleResult?.triangle4 ?? null} />
                <DuvalTriangle5 result={result.duvalTriangleResult?.triangle5 ?? null} />
                <DuvalPentagon1 result={result.duvalPentagon1Result ?? null} />
                <DuvalPentagon2 result={result.duvalPentagon2Result ?? null} />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <KeyGasCard result={result.keyGasResult ?? null} />
              <DoernenburgCard result={result.doernenburgResult ?? null} />
            </div>
            <EngineSummary detail={detail} />
          </>
        )}

        {activeTab === 'recommendation' && <RecommendationPlan detail={detail} />}
      </div>
    </div>
  );
}
