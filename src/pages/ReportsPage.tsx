import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ReportDocument } from '@/components/reports/ReportDocument';
import type { ReportSummary } from '@/types';

export function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReports, getReportSections } = useAppState();
  const reports = getReports();

  const selectedReport = id ? (reports.find((r) => r.id === id || r.reportNo === id) ?? null) : null;

  const columns = [
    {
      key: 'reportNo',
      header: 'Report No',
      render: (row: ReportSummary) => (
        <span className="font-mono text-xs">{row.reportNo}</span>
      ),
    },
    {
      key: 'transformer',
      header: 'Transformer',
      render: (row: ReportSummary) => row.transformerName,
    },
    {
      key: 'substation',
      header: 'Substation',
      render: (row: ReportSummary) => row.substation,
    },
    {
      key: 'sampleDate',
      header: 'Sample Date',
      render: (row: ReportSummary) => (
        <span className="tabular-nums">{row.sampleDate}</span>
      ),
    },
    {
      key: 'generatedDate',
      header: 'Generated',
      render: (row: ReportSummary) => (
        <span className="tabular-nums">{row.generatedDate}</span>
      ),
    },
  ];

  const sections = selectedReport
    ? getReportSections(selectedReport.analysisId)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {!selectedReport ? (
        <>
          <PageHeader
            title="Reports"
            description="Generated DGA analysis reports for laboratory records and distribution."
          />
          <div className="mb-3 text-sm text-gray-600">
            {reports.length} report{reports.length !== 1 ? 's' : ''} available
          </div>
          <DataTable
            columns={columns}
            data={reports}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/reports/${row.id}`)}
            emptyMessage="No reports available. Run an analysis to generate reports."
          />
        </>
      ) : (
        <div>
          <div className="no-print mb-4 flex gap-3">
            <Button onClick={handlePrint}>Print Report</Button>
            <Button variant="secondary" onClick={() => navigate('/reports')}>
              Back to List
            </Button>
          </div>

          {sections ? (
            <ReportDocument
              reportNo={selectedReport.reportNo}
              date={selectedReport.generatedDate}
              sections={sections}
            />
          ) : (
            <p className="text-sm text-gray-600">Report data could not be loaded.</p>
          )}
        </div>
      )}
    </div>
  );
}
