import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { VisualizationCard } from './VisualizationCard';
import {
  axisProps,
  chartColors,
  seriesAnimation,
  tooltipLabelStyle,
  tooltipStyle,
} from './chartStyles';
import type { GasBarEntry } from './types';

interface CurrentGasBarChartProps {
  data: GasBarEntry[];
  result?: string | null;
  /** Gas labels to visually emphasize (e.g. threshold-exceeding gases). */
  highlightGases?: string[];
}

export function CurrentGasBarChart({ data, result, highlightGases = [] }: CurrentGasBarChartProps) {
  return (
    <VisualizationCard
      title="Current Sample Gas Profile"
      subtitle="Latest sample dissolved gas concentrations (ppm)"
      resultLabel="Gas Profile Assessment"
      result={result}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="gas" {...axisProps} />
          <YAxis
            {...axisProps}
            width={56}
            label={{ value: 'ppm', angle: -90, position: 'insideLeft', fontSize: 11, fill: chartColors.axis }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ fill: 'rgba(15, 76, 129, 0.06)' }}
            formatter={(value: number) => [`${value} ppm`, 'Concentration']}
          />
          <Bar dataKey="value" name="Concentration (ppm)" barSize={26} {...seriesAnimation}>
            {data.map((entry) => (
              <Cell
                key={entry.gas}
                fill={highlightGases.includes(entry.gas) ? chartColors.barHighlight : chartColors.bar}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </VisualizationCard>
  );
}
