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
import type { MultiGasTrendPoint } from './types';

interface GasTrendChartProps {
  data: MultiGasTrendPoint[];
  result?: string | null;
}

const gasLines = [
  { key: 'h2', name: 'H₂', color: chartColors.h2 },
  { key: 'ch4', name: 'CH₄', color: chartColors.ch4 },
  { key: 'c2h6', name: 'C₂H₆', color: chartColors.c2h6 },
  { key: 'c2h4', name: 'C₂H₄', color: chartColors.c2h4 },
  { key: 'c2h2', name: 'C₂H₂', color: chartColors.c2h2 },
  { key: 'co', name: 'CO', color: chartColors.co },
  { key: 'co2', name: 'CO₂', color: chartColors.co2 },
] as const;

export function GasTrendChart({ data, result }: GasTrendChartProps) {
  return (
    <VisualizationCard
      title="Gas Concentration Trend"
      subtitle="Dissolved gas concentrations over the full sample history (ppm)"
      resultLabel="Trend Assessment"
      result={result}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
          syncId={TRENDS_SYNC_ID}
        >
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis
            {...axisProps}
            width={52}
            label={{ value: 'ppm', angle: -90, position: 'insideLeft', fontSize: 11, fill: chartColors.axis }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: '#c8cdd3', strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) => [`${value} ppm`, name]}
          />
          <Legend wrapperStyle={legendStyle} iconType="plainline" />
          {gasLines.map(({ key, name, color }) => (
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
