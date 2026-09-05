import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context';
import { formatDgaStatus, parseDgaStatus } from '@/lib/analysis';
import { getSampleById } from '@/lib/selectors';
import type { DgaStatus } from '@/types';

interface AnalysisTimelineProps {
  transformerId: string;
  currentAnalysisId: string;
}

const markerStyles: Record<DgaStatus | 'Pending', string> = {
  STATUS_1: 'bg-status-normal',
  STATUS_2: 'bg-status-caution',
  STATUS_3: 'bg-status-warning',
  Pending: 'bg-status-pending',
};

/**
 * Compact history strip: one status-colored marker per analysis of this
 * transformer, in sample-date order, current analysis highlighted. Answers
 * "is this unit getting healthier or worse?" before any tab is opened.
 */
export function AnalysisTimeline({ transformerId, currentAnalysisId }: AnalysisTimelineProps) {
  const { state } = useAppState();
  const navigate = useNavigate();

  const entries = state.analyses
    .filter((a) => a.transformerId === transformerId)
    .map((analysis) => ({
      analysis,
      sampleDate: getSampleById(state, analysis.sampleId)?.sampleDate ?? analysis.createdAt.split('T')[0],
    }))
    .sort((a, b) => a.sampleDate.localeCompare(b.sampleDate));

  if (entries.length < 2) {
    return null;
  }

  return (
    <div className="mb-4 border border-gray-300 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(28,39,51,0.05)]">
      <div className="flex items-center gap-4">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Transformer History
        </p>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
          {entries.map(({ analysis, sampleDate }, i) => {
            const status = parseDgaStatus(analysis.status);
            const isCurrent = analysis.id === currentAnalysisId;
            return (
              <div key={analysis.id} className="flex items-center">
                {i > 0 && <span className="h-px w-4 shrink-0 bg-gray-300" aria-hidden="true" />}
                <button
                  type="button"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                  title={`${sampleDate} — ${formatDgaStatus(status)} (${analysis.id})`}
                  aria-label={`Open analysis ${analysis.id}, ${sampleDate}, status ${formatDgaStatus(status)}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`h-3.5 w-3.5 shrink-0 cursor-pointer ${markerStyles[status]} ${
                    isCurrent
                      ? 'scale-125 ring-2 ring-gray-900 ring-offset-1'
                      : 'opacity-75 hover:opacity-100 hover:ring-1 hover:ring-gray-400'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="hidden shrink-0 items-center gap-3 text-[10px] text-gray-500 md:flex">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 bg-status-normal" /> Status 1
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 bg-status-caution" /> Status 2
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 bg-status-warning" /> Status 3
          </span>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        {entries.length} analyses, {entries[0].sampleDate} → {entries[entries.length - 1].sampleDate} · click a marker to open
      </p>
    </div>
  );
}
