import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { FormField, TextInput } from '@/components/ui/FormField';
import { TrendCharts } from '@/components/charts/TrendCharts';
import { ReportDocument } from '@/components/reports/ReportDocument';
import type { CreateTransformerInput, SampleHistoryRow } from '@/types';

const detailTabs = [
  { id: 'information', label: 'Information' },
  { id: 'history', label: 'Sample History' },
  { id: 'trends', label: 'Trend Graphs' },
  { id: 'reports', label: 'Reports' },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="w-1/3 px-4 py-3 text-sm font-medium text-gray-600">{label}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{value}</td>
    </tr>
  );
}

export function TransformerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getTransformerSummary,
    getSampleHistory,
    getGasTrends,
    getStatusTrends,
    getReports,
    getReportSections,
    updateTransformer,
    deleteTransformer,
  } = useAppState();

  const summary = id ? getTransformerSummary(id) : null;
  const [activeTab, setActiveTab] = useState('information');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CreateTransformerInput | null>(null);

  if (!summary) {
    return (
      <div>
        <PageHeader title="Transformer Not Found" />
        <p className="text-sm text-gray-600">The requested transformer could not be found.</p>
        <Link to="/transformers" className="mt-4 inline-block text-sm text-gray-800 underline">
          Back to Transformers
        </Link>
      </div>
    );
  }

  const { transformer, lastStatus, lastSampleDate } = summary;
  const sampleHistory = getSampleHistory(transformer.id);
  const transformerReports = getReports().filter((r) => r.transformerId === transformer.id);
  const gasTrendData = getGasTrends(transformer.id);
  const statusTrendData = getStatusTrends(transformer.id);

  const startEdit = () => {
    setEditForm({
      transformerName: transformer.transformerName,
      serialNumber: transformer.serialNumber,
      equipmentId: transformer.equipmentId,
      substation: transformer.substation,
      manufacturer: transformer.manufacturer,
      voltageRating: transformer.voltageRating,
      mvaRating: transformer.mvaRating,
      commissioningDate: transformer.commissioningDate,
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    await updateTransformer(transformer.id, editForm);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Delete ${transformer.transformerName}? This will also remove all associated samples and analyses.`,
      )
    ) {
      await deleteTransformer(transformer.id);
      navigate('/transformers');
    }
  };

  const historyColumns = [
    {
      key: 'date',
      header: 'Sample Date',
      render: (row: SampleHistoryRow) => (
        <span className="tabular-nums">{row.sampleDate}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SampleHistoryRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      render: (row: SampleHistoryRow) => row.diagnosis,
    },
  ];

  const firstReport = transformerReports[0];
  const firstReportSections = firstReport
    ? getReportSections(firstReport.analysisId)
    : null;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <PageHeader
          title={transformer.transformerName}
          description={`${transformer.substation} — ${transformer.voltageRating}, ${transformer.mvaRating}`}
        />
        <div className="flex shrink-0 gap-2 pt-1">
          <Link to={`/analysis/new?transformer=${transformer.id}`}>
            <Button>New Analysis</Button>
          </Link>
          <Link to="/transformers">
            <Button variant="secondary">Back to List</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 border border-gray-300 bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-600">Last Status:</span>
        <StatusBadge status={lastStatus} />
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">
          Last Sample:{' '}
          <span className="tabular-nums font-medium text-gray-900">
            {lastSampleDate ?? '—'}
          </span>
        </span>
      </div>

      <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'information' && (
          <Card>
            {isEditing && editForm ? (
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4">
                  <FormField label="Transformer Name" htmlFor="edit-name" required>
                    <TextInput
                      id="edit-name"
                      value={editForm.transformerName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, transformerName: e.target.value })
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Serial Number" htmlFor="edit-serial" required>
                    <TextInput
                      id="edit-serial"
                      value={editForm.serialNumber}
                      onChange={(e) =>
                        setEditForm({ ...editForm, serialNumber: e.target.value })
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Equipment ID" htmlFor="edit-equipment" required>
                    <TextInput
                      id="edit-equipment"
                      value={editForm.equipmentId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, equipmentId: e.target.value })
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Substation" htmlFor="edit-substation" required>
                    <TextInput
                      id="edit-substation"
                      value={editForm.substation}
                      onChange={(e) =>
                        setEditForm({ ...editForm, substation: e.target.value })
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Manufacturer" htmlFor="edit-manufacturer">
                    <TextInput
                      id="edit-manufacturer"
                      value={editForm.manufacturer}
                      onChange={(e) =>
                        setEditForm({ ...editForm, manufacturer: e.target.value })
                      }
                    />
                  </FormField>
                  <FormField label="Voltage Rating" htmlFor="edit-voltage">
                    <TextInput
                      id="edit-voltage"
                      value={editForm.voltageRating}
                      onChange={(e) =>
                        setEditForm({ ...editForm, voltageRating: e.target.value })
                      }
                    />
                  </FormField>
                  <FormField label="MVA Rating" htmlFor="edit-mva">
                    <TextInput
                      id="edit-mva"
                      value={editForm.mvaRating}
                      onChange={(e) =>
                        setEditForm({ ...editForm, mvaRating: e.target.value })
                      }
                    />
                  </FormField>
                  <FormField label="Commissioning Date" htmlFor="edit-commissioning">
                    <TextInput
                      id="edit-commissioning"
                      type="date"
                      value={editForm.commissioningDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, commissioningDate: e.target.value })
                      }
                    />
                  </FormField>
                </div>
                <div className="flex gap-3 border-t border-gray-200 px-4 py-4">
                  <Button type="submit">Save Changes</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <table className="w-full border-collapse">
                  <tbody>
                    <InfoRow label="Transformer Name" value={transformer.transformerName} />
                    <InfoRow label="Serial Number" value={transformer.serialNumber} />
                    <InfoRow label="Equipment ID" value={transformer.equipmentId} />
                    <InfoRow label="Manufacturer" value={transformer.manufacturer} />
                    <InfoRow label="Voltage Rating" value={transformer.voltageRating} />
                    <InfoRow label="MVA Rating" value={transformer.mvaRating} />
                    <InfoRow label="Commissioning Date" value={transformer.commissioningDate} />
                    <InfoRow label="Substation" value={transformer.substation} />
                  </tbody>
                </table>
                <div className="flex gap-3 border-t border-gray-200 px-4 py-4">
                  <Button onClick={startEdit}>Edit</Button>
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {activeTab === 'history' && (
          <div>
            {sampleHistory.length === 0 ? (
              <Card>
                <p className="text-sm text-gray-500">
                  No sample history recorded for this transformer.
                </p>
              </Card>
            ) : (
              <DataTable
                columns={historyColumns}
                data={sampleHistory}
                getRowKey={(row) => row.id}
                onRowClick={(row) => {
                  if (row.analysisId) navigate(`/analysis/${row.analysisId}`);
                }}
                isRowClickable={(row) => row.analysisId != null}
              />
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <TrendCharts gasTrendData={gasTrendData} statusTrendData={statusTrendData} />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {transformerReports.length > 0 ? (
              <>
                <Card title="Generated Reports">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Report No</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Sample Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformerReports.map((report) => (
                        <tr key={report.id} className="border-b border-gray-200">
                          <td className="px-4 py-2.5 font-mono text-xs">{report.reportNo}</td>
                          <td className="px-4 py-2.5 tabular-nums">{report.sampleDate}</td>
                          <td className="px-4 py-2.5 tabular-nums">{report.generatedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                {firstReport && firstReportSections && (
                  <ReportDocument
                    reportNo={firstReport.reportNo}
                    date={firstReport.generatedDate}
                    sections={firstReportSections}
                  />
                )}
              </>
            ) : (
              <Card>
                <p className="text-sm text-gray-500">
                  No reports generated for this transformer.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
