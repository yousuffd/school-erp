import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

/** DESIGN_SYSTEM.md §4 "KPI Card": icon chip + big number + label + trend line. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendDirection = 'up',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-button bg-accent-light">
        <Icon size={20} className="text-accent" />
      </div>
      <div className="text-kpi font-bold text-text-primary">{value}</div>
      <div className="text-body text-text-secondary">{label}</div>
      {trend && (
        <div
          className={clsx(
            'mt-2 text-caption font-medium',
            trendDirection === 'up' ? 'text-success' : 'text-danger',
          )}
        >
          {trendDirection === 'up' ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  );
}
