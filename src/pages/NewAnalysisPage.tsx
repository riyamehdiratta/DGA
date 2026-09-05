import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { WizardSteps } from '@/components/ui/WizardSteps';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, TextInput, TextArea } from '@/components/ui/FormField';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatCard';
import {
  GAS_FIELDS,
  type GasField,
  type SampleFormInput,
  type TransformerSummary,
  type WizardStep,
} from '@/types';

const wizardSteps = [
  { step: 1, label: 'Select Transformer' },
  { step: 2, label: 'Enter DGA Values' },
  { step: 3, label: 'Review & Analyze' },
  { step: 4, label: 'View Results' },
];

const gasFieldLabels: Record<(typeof GAS_FIELDS)[number], string> = {
  h2: 'H2',
  ch4: 'CH4',
  c2h6: 'C2H6',
  c2h4: 'C2H4',
  c2h2: 'C2H2',
  co: 'CO',
  co2: 'CO2',
  o2: 'O2',
  n2: 'N2',
};

const optionalGasFields = new Set<GasField>(['o2', 'n2']);
const requiredGasFields = GAS_FIELDS.filter((f) => !optionalGasFields.has(f));

/**
 * Draft form state keeps every gas field nullable (including the ones
 * that are required in the final payload) so a blank input is
 * distinguishable from an explicitly-entered 0 ppm reading — a real,
 * common value for gases like C2H2. Only at submission time, once
 * validation has confirmed every required field is non-null, is this
 * coerced into the DB-shaped SampleFormInput.
 */
type DraftSample = Record<GasField, number | null> & { sampleDate: string; remarks: string };

function createEmptyDraft(): DraftSample {
  return {
    sampleDate: new Date().toISOString().split('T')[0],
    h2: null,
    ch4: null,
    c2h6: null,
    c2h4: null,
    c2h2: null,
    co: null,
    co2: null,
    o2: null,
    n2: null,
    remarks: '',
  };
}

export function NewAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('transformer');
  const { getTransformerSummaries, runAnalysis } = useAppState();
  const summaries = getTransformerSummaries();

  const [step, setStep] = useState<WizardStep>(preselectedId ? 2 : 1);
  const [selectedSummary, setSelectedSummary] = useState<TransformerSummary | null>(
    preselectedId
      ? summaries.find((s) => s.transformer.id === preselectedId) ?? null
      : null,
  );
  const [sample, setSample] = useState<DraftSample>(createEmptyDraft());
  const [completedAnalysisId, setCompletedAnalysisId] = useState<string | null>(null);
  const [transformerSearch, setTransformerSearch] = useState('');

  const filteredSummaries = summaries.filter(({ transformer: tx }) => {
    const q = transformerSearch.toLowerCase();
    return (
      !q ||
      tx.transformerName.toLowerCase().includes(q) ||
      tx.substation.toLowerCase().includes(q)
    );
  });

  const updateNumber = (field: GasField, value: string) => {
    setSample((prev) => ({
      ...prev,
      [field]: value === '' ? null : parseFloat(value),
    }));
  };

  const updateText = (field: 'sampleDate' | 'remarks', value: string) => {
    setSample((prev) => ({ ...prev, [field]: value }));
  };

  const gasInputValue = (key: GasField): string | number => {
    const value = sample[key];
    return value == null ? '' : value;
  };

  const missingRequiredFields = requiredGasFields.filter((f) => sample[f] == null);
  const canProceedToReview = missingRequiredFields.length === 0 && sample.sampleDate !== '';

  const handleAnalyze = async () => {
    if (!selectedSummary || !canProceedToReview) return;
    const payload: SampleFormInput = {
      sampleDate: sample.sampleDate,
      remarks: sample.remarks,
      h2: sample.h2 as number,
      ch4: sample.ch4 as number,
      c2h6: sample.c2h6 as number,
      c2h4: sample.c2h4 as number,
      c2h2: sample.c2h2 as number,
      co: sample.co as number,
      co2: sample.co2 as number,
      o2: sample.o2,
      n2: sample.n2,
    };
    const analysis = await runAnalysis(selectedSummary.transformer.id, payload);
    setCompletedAnalysisId(analysis.id);
    setStep(4);
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedSummary(null);
    setSample(createEmptyDraft());
    setCompletedAnalysisId(null);
  };

  const transformerColumns = [
    {
      key: 'name',
      header: 'Transformer',
      render: (row: TransformerSummary) => (
        <span className="font-medium">{row.transformer.transformerName}</span>
      ),
    },
    {
      key: 'substation',
      header: 'Substation',
      render: (row: TransformerSummary) => row.transformer.substation,
    },
    {
      key: 'status',
      header: 'Last Status',
      render: (row: TransformerSummary) => <StatusBadge status={row.lastStatus} />,
    },
    {
      key: 'lastSample',
      header: 'Last Sample',
      render: (row: TransformerSummary) => (
        <span className="tabular-nums">{row.lastSampleDate ?? '—'}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="New Analysis"
        description="Enter a new DGA sample and run diagnostic analysis."
      />

      <WizardSteps steps={wizardSteps} currentStep={step} />

      <div className="mt-6">
        {step === 1 && (
          <div>
            <div className="mb-4 w-80">
              <FormField label="Search Transformer" htmlFor="tx-search">
                <TextInput
                  id="tx-search"
                  placeholder="Filter by name or substation..."
                  value={transformerSearch}
                  onChange={(e) => setTransformerSearch(e.target.value)}
                />
              </FormField>
            </div>
            <DataTable
              columns={transformerColumns}
              data={filteredSummaries}
              getRowKey={(row) => row.transformer.id}
              onRowClick={(row) => {
                setSelectedSummary(row);
                setStep(2);
              }}
              emptyMessage="No transformers registered. Add a transformer first."
            />
          </div>
        )}

        {step === 2 && selectedSummary && (
          <div>
            <div className="mb-4 border border-gray-300 bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-600">Selected: </span>
              <span className="font-medium text-gray-900">
                {selectedSummary.transformer.transformerName}
              </span>
              <span className="text-gray-400"> — </span>
              <span className="text-gray-600">{selectedSummary.transformer.substation}</span>
            </div>

            <Card title="Gas Concentrations">
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                {GAS_FIELDS.map((key) => (
                  <FormField
                    key={key}
                    label={gasFieldLabels[key]}
                    htmlFor={key}
                    unit="ppm"
                    required={!optionalGasFields.has(key)}
                  >
                    <TextInput
                      id={key}
                      type="number"
                      min="0"
                      step="any"
                      value={gasInputValue(key)}
                      onChange={(e) => updateNumber(key, e.target.value)}
                      placeholder={optionalGasFields.has(key) ? 'Optional' : undefined}
                    />
                  </FormField>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-200 pt-6">
                <FormField label="Sample Date" htmlFor="sampleDate" required>
                  <TextInput
                    id="sampleDate"
                    type="date"
                    value={sample.sampleDate}
                    onChange={(e) => updateText('sampleDate', e.target.value)}
                  />
                </FormField>
                <FormField label="Remarks" htmlFor="remarks">
                  <TextArea
                    id="remarks"
                    value={sample.remarks}
                    onChange={(e) => updateText('remarks', e.target.value)}
                    placeholder="Sampling conditions, oil temperature, load at time of sample..."
                  />
                </FormField>
              </div>
            </Card>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => setStep(3)} disabled={!canProceedToReview}>
                Continue to Review
              </Button>
              <Button variant="secondary" onClick={() => setStep(1)}>
                Change Transformer
              </Button>
              {!canProceedToReview && (
                <span className="text-xs text-red-600">
                  {missingRequiredFields.length > 0
                    ? `Enter ${missingRequiredFields.map((f) => gasFieldLabels[f]).join(', ')} before continuing.`
                    : 'Set a sample date before continuing.'}
                </span>
              )}
            </div>
          </div>
        )}

        {step === 3 && selectedSummary && (
          <div>
            <Card title="Review Sample Data">
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Transformer</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedSummary.transformer.transformerName}
                  </p>
                  <p className="text-gray-600">{selectedSummary.transformer.substation}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Sample Date</p>
                  <p className="mt-1 tabular-nums text-gray-900">{sample.sampleDate}</p>
                </div>
              </div>

              <table className="w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Gas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600">Concentration (ppm)</th>
                  </tr>
                </thead>
                <tbody>
                  {GAS_FIELDS.map((key) => (
                    <tr key={key} className="border-b border-gray-200">
                      <td className="px-4 py-2 font-medium text-gray-700">{gasFieldLabels[key]}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-900">
                        {sample[key] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sample.remarks && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium uppercase text-gray-500">Remarks</p>
                  <p className="mt-1 text-sm text-gray-700">{sample.remarks}</p>
                </div>
              )}
            </Card>

            <div className="mt-4 flex gap-3">
              <Button onClick={handleAnalyze} disabled={!canProceedToReview}>
                Run Analysis
              </Button>
              <Button variant="secondary" onClick={() => setStep(2)}>
                Edit Values
              </Button>
            </div>
          </div>
        )}

        {step === 4 && selectedSummary && completedAnalysisId && (
          <div>
            <Card title="Analysis Complete">
              <p className="mb-4 text-sm text-gray-700">
                Sample for{' '}
                <strong>{selectedSummary.transformer.transformerName}</strong> has been
                submitted. Diagnostic results are available for review.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate(`/analysis/${completedAnalysisId}`)}>
                  View Full Results
                </Button>
                <Button variant="secondary" onClick={() => navigate('/analysis/history')}>
                  Go to History
                </Button>
                <Button variant="secondary" onClick={resetWizard}>
                  Start New Analysis
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
