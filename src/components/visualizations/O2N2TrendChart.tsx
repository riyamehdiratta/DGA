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
import type { O2N2TrendPoint } from './types';

interface O2N2TrendChartProps {
  data: O2N2TrendPoint[];
  result?: string | null;
}

export function O2N2TrendChart({ data, result }: O2N2TrendChartProps) {
  return (
    <VisualizationCard
      title="O₂/N₂ Trend"
      subtitle="Oxygen and nitrogen concentrations with O₂/N₂ ratio"
      resultLabel="Paper Degradation Assessment"
      result={result}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 44, left: 4, bottom: 0 }}
          syncId={TRENDS_SYNC_ID}
        >
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis
            yAxisId="ppm"
            {...axisProps}
            width={56}
            label={{ value: 'ppm', angle: -90, position: 'insideLeft', fontSize: 11, fill: chartColors.axis }}
          />
          <YAxis
            yAxisId="ratio"
            orientation="right"
            domain={[0, (dataMax: number) => Math.max(0.25, dataMax * 1.15)]}
            tickFormatter={(v: number) => v.toFixed(2)}
            {...axisProps}
            width={42}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: '#c8cdd3', strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={legendStyle} iconType="plainline" />
          <Line
            yAxisId="ppm"
            type="monotone"
            dataKey="o2"
            name="O₂ (ppm)"
            stroke={chartColors.o2}
            strokeWidth={1.6}
            dot={{ r: 2.5, strokeWidth: 0, fill: chartColors.o2 }}
            activeDot={{ r: 4.5, strokeWidth: 1.5, stroke: '#ffffff' }}
            {...seriesAnimation}
          />
          <Line
            yAxisId="ppm"
            type="monotone"
            dataKey="n2"
            name="N₂ (ppm)"
            stroke={chartColors.n2}
            strokeWidth={1.6}
            dot={{ r: 2.5, strokeWidth: 0, fill: chartColors.n2 }}
            activeDot={{ r: 4.5, strokeWidth: 1.5, stroke: '#ffffff' }}
            {...seriesAnimation}
          />
          <Line
            yAxisId="ratio"
            type="monotone"
            dataKey="ratio"
            name="O₂/N₂ Ratio"
            stroke={chartColors.c2h2}
            strokeWidth={1.6}
            strokeDasharray="5 3"
            dot={{ r: 2.5, strokeWidth: 0, fill: chartColors.c2h2 }}
            activeDot={{ r: 4.5, strokeWidth: 1.5, stroke: '#ffffff' }}
            {...seriesAnimation}
          />
        </LineChart>
      </ResponsiveContainer>
    </VisualizationCard>
  );
}
