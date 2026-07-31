'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
];

export interface DonutDatum {
  name: string;
  value: number;
}

/**
 * Generic donut chart — DESIGN_SYSTEM.md §4 "Donut / Ring Charts": center
 * label = total + descriptor, legend as right-hand list. Renamed from
 * RoleDistributionDonut (session 26) to serve any grouped-count
 * breakdown, not just role distribution.
 *
 * Fixed a centering bug: the center total/label used to be positioned
 * with a hardcoded `left-[27%]` magic number, tuned to look right only
 * when Recharts' built-in <Legend/> happened to consume a particular
 * width. Any dataset with more or longer category names (13 roles vs 4
 * procurement statuses) shifts how much horizontal space Recharts gives
 * the Pie vs the Legend, so the label drifted off-center. Fixed by
 * rendering the legend ourselves as a plain flex sibling instead of
 * Recharts' <Legend/>, so the chart and legend each get an explicit,
 * independent width — the center label is now positioned at exactly
 * 50%/50% of the chart's OWN wrapper, which always matches the Pie's
 * actual center regardless of legend content.
 */
export function CategoryDonut({ data, centerLabel }: { data: DonutDatum[]; centerLabel: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative min-w-0 flex-1">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={1.5}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-body-lg font-bold text-text-primary">{total}</div>
          <div className="text-caption text-text-secondary">{centerLabel}</div>
        </div>
      </div>

      <ul className="shrink-0 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5 text-caption">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{d.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
