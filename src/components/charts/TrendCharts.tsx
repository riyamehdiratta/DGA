import type { TrendDataPoint, StatusTrendDataPoint } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';

const chartColors = {
  grid: '#e5e7eb',
  axis: '#6b7280',
  h2: '#374151',
  ch4: '#4b5563',
  c2h2: '#dc2626',
  co: '#6b7280',
  status: '#374151',
};

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 0,
  fontSize: 12,
};

interface TrendChartsProps {
  gasTrendData: TrendDataPoint[];
  statusTrendData: StatusTrendDataPoint[];
}

export function TrendCharts({ gasTrendData, statusTrendData }: TrendChartsProps) {
  if (gasTrendData.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gray-500">
          No sample data available to display trends for this transformer.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Gas Concentration Trends (ppm)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gasTrendData}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: chartColors.axis }}
              axisLine={{ stroke: chartColors.grid }}
              tickLine={{ stroke: chartColors.grid }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: chartColors.axis }}
              axisLine={{ stroke: chartColors.grid }}
              tickLine={{ stroke: chartColors.grid }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="h2" name="H2" stroke={chartColors.h2} strokeWidth={1.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="ch4" name="CH4" stroke={chartColors.ch4} strokeWidth={1.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="c2h2" name="C2H2" stroke={chartColors.c2h2} strokeWidth={1.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="co" name="CO" stroke={chartColors.co} strokeWidth={1.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {statusTrendData.length > 0 && (
        <Card title="Status History">
          <p className="mb-3 text-xs text-gray-500">
            Status scale: 1 = Status 1, 2 = Status 2, 3 = Status 3
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={statusTrendData}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: chartColors.axis }}
                axisLine={{ stroke: chartColors.grid }}
                tickLine={{ stroke: chartColors.grid }}
              />
              <YAxis
                domain={[1, 3]}
                ticks={[1, 2, 3]}
                tick={{ fontSize: 12, fill: chartColors.axis }}
                axisLine={{ stroke: chartColors.grid }}
                tickLine={{ stroke: chartColors.grid }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="stepAfter" dataKey="statusValue" name="DGA Status" stroke={chartColors.status} strokeWidth={1.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
