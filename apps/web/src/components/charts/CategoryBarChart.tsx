'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface BarDatum {
  name: string;
  value: number;
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
];

/**
 * Generic bar chart — same DESIGN_SYSTEM.md chart palette as CategoryDonut.
 * Tightened this session ("charts are huge... make the charts look a
 * little more premium"): reduced height (260→220), capped bar width
 * (maxBarSize) so a chart with only 2-3 categories doesn't stretch into
 * giant blocky bars, removed axis lines/tick marks for a cleaner minimal
 * look, softened the grid, added a hover-cursor highlight, and swapped in
 * the shared ChartTooltip instead of Recharts' plain default tooltip box.
 */
export function CategoryBarChart({
  data,
  multiColor = false,
}: {
  data: BarDatum[];
  multiColor?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-canvas)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
          {data.map((_, i) => (
            <Cell key={i} fill={multiColor ? CHART_COLORS[i % CHART_COLORS.length] : 'var(--chart-1)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
