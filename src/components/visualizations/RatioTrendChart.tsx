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
import { VisualizationCard } from './VisualizationCard';
import {
  axisProps,
  chartColors,
  legendStyle,
  seriesAnimation,
  tooltipLabelStyle,
  tooltipStyle,
  TRENDS_SYNC_ID,
} from './chartStyles';
import type { RatioTrendPoint } from './types';

interface RatioTrendChartProps {
  data: RatioTrendPoint[];
  result?: string | null;
}

const ratioLines = [
  { key: 'ch4h2', name: 'CH₄/H₂', color: chartColors.ch4h2 },
  { key: 'c2h2c2h4', name: 'C₂H₂/C₂H₄', color: chartColors.c2h2c2h4 },
  { key: 'c2h4c2h6', name: 'C₂H₄/C₂H₆', color: chartColors.c2h4c2h6 },
] as const;

export function RatioTrendChart({ data, result }: RatioTrendChartProps) {
  return (
    <VisualizationCard
      title="Diagnostic Ratio Trend"
      subtitle="Key gas ratios over the sample history (dimensionless)"
      resultLabel="Ratio Assessment"
      result={result}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
          syncId={TRENDS_SYNC_ID}
        >
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis
            {...axisProps}
            width={44}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: '#c8cdd3', strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) => [value.toFixed(3), name]}
          />
          <Legend wrapperStyle={legendStyle} iconType="plainline" />
          {ratioLines.map(({ key, name, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={color}
              strokeWidth={1.6}
              dot={{ r: 2.5, strokeWidth: 0, fill: color }}
              activeDot={{ r: 4.5, strokeWidth: 1.5, stroke: '#ffffff' }}
              {...seriesAnimation}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </VisualizationCard>
  );
}
