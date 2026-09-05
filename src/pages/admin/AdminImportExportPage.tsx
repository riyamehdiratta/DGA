import { useRef, useState } from 'react';
import {
  exportAnalysesXlsx,
  exportSamplesXlsx,
  exportTransformersXlsx,
  importSamplesXlsx,
  importTransformersXlsx,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useAppState } from '@/context';
import type { ImportSummary } from '@/types';

function ImportSummaryView({ summary, label = 'row(s)' }: { summary: ImportSummary; label?: string }) {
  return (
    <div className="mt-3 text-sm">
      <p className="text-gray-700">Imported {summary.imported} {label}.</p>
      {summary.errors.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-red-700">
          {summary.errors.map((e) => (
            <li key={e.row}>
              Row {e.row}: {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminImportExportPage() {
  const { state } = useAppState();
  const [error, setError] = useState<string | null>(null);

  const [transformerSummary, setTransformerSummary] = useState<ImportSummary | null>(null);
  const [transformerBusy, setTransformerBusy] = useState(false);
  const transformerFileRef = useRef<HTMLInputElement>(null);

  const [selectedTransformerId, setSelectedTransformerId] = useState('');
  const [sampleSummary, setSampleSummary] = useState<ImportSummary | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const sampleFileRef = useRef<HTMLInputElement>(null);

  async function handleTransformerImport() {
    const file = transformerFileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setTransformerBusy(true);
    try {
      const summary = await importTransformersXlsx(file);
      setTransformerSummary(summary);
      if (transformerFileRef.current) transformerFileRef.current.value = '';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setTransformerBusy(false);
    }
  }

  async function handleSampleImport() {
    const file = sampleFileRef.current?.files?.[0];
    if (!file || !selectedTransformerId) return;
    setError(null);
    setSampleBusy(true);
    try {
      const summary = await importSamplesXlsx(selectedTransformerId, file);
      setSampleSummary(summary);
      if (sampleFileRef.current) sampleFileRef.current.value = '';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setSampleBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Import / Export" description="Bulk transformer and sample data via .xlsx." />

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <Card title="Transformers" className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => void exportTransformersXlsx()}>
            Export .xlsx
          </Button>
          <input ref={transformerFileRef} type="file" accept=".xlsx" className="text-sm" />
          <Button type="button" onClick={() => void handleTransformerImport()} disabled={transformerBusy}>
            {transformerBusy ? 'Importing...' : 'Import .xlsx'}
          </Button>
        </div>
        {transformerSummary && <ImportSummaryView summary={transformerSummary} />}
      </Card>

      <Card title="Samples" className="mb-6">
        <div className="mb-3 w-72">
          <FormField label="Transformer" htmlFor="sample-import-transformer">
            <select
              id="sample-import-transformer"
              className="w-full px-3 py-2 text-sm"
              value={selectedTransformerId}
              onChange={(e) => setSelectedTransformerId(e.target.value)}
            >
              <option value="">Select a transformer...</option>
              {state.transformers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.transformerName} ({t.substation})
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!selectedTransformerId}
            onClick={() => selectedTransformerId && void exportSamplesXlsx(selectedTransformerId)}
          >
            Export .xlsx
          </Button>
          <input ref={sampleFileRef} type="file" accept=".xlsx" className="text-sm" />
          <Button
            type="button"
            disabled={!selectedTransformerId || sampleBusy}
            onClick={() => void handleSampleImport()}
          >
            {sampleBusy ? 'Importing...' : 'Import .xlsx'}
          </Button>
        </div>
        {sampleSummary && <ImportSummaryView summary={sampleSummary} label="sample(s), analyzed" />}
      </Card>

      <Card title="Analyses">
        <Button type="button" variant="secondary" onClick={() => void exportAnalysesXlsx()}>
          Export .xlsx
        </Button>
      </Card>
    </div>
  );
}
