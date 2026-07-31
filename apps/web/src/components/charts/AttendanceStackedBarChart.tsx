'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface AttendanceBarDatum {
  name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

/**
 * Stacked bar chart for attendance status over time — replaces the
 * "Leave Requests by Status" widget (session: leave requests never
 * populated for Riverside; attendance is the more useful signal and now
 * has real seeded data). Uses DESIGN_SYSTEM.md semantic status colors
 * (success/danger/warning/info) rather than the generic chart palette,
 * since attendance status already carries meaning via those tokens
 * elsewhere in the app (§2 Color Tokens).
 */
export function AttendanceStackedBarChart({ data }: { data: AttendanceBarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-canvas)' }} />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
        />
        <Bar dataKey="present" name="Present" stackId="a" fill="var(--success)" maxBarSize={44} />
        <Bar dataKey="absent" name="Absent" stackId="a" fill="var(--danger)" maxBarSize={44} />
        <Bar dataKey="late" name="Late" stackId="a" fill="var(--warning)" maxBarSize={44} />
        <Bar dataKey="excused" name="Excused" stackId="a" fill="var(--info)" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
