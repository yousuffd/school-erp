import clsx from 'clsx';

type MetricStatus = 'good' | 'warning' | 'bad';

const STATUS_STYLES: Record<MetricStatus, { badgeBg: string; badgeText: string; label: string }> = {
  good: { badgeBg: 'bg-success/10', badgeText: 'text-success', label: 'Good' },
  warning: { badgeBg: 'bg-warning/10', badgeText: 'text-warning', label: 'Warning' },
  bad: { badgeBg: 'bg-danger/10', badgeText: 'text-danger', label: 'Needs attention' },
};

/**
 * Per the Dashboard Metrics & UI/UX Requirements spec's "Metric Card
 * Standard" (§2): current value + change + target + status + actionable
 * insight, all in one card. changePoints is intentionally optional — some
 * metrics (fee collection, teacher presence) don't have enough historical
 * data yet to show an honest trend, and the card degrades gracefully
 * rather than fabricating one (see dashboard.service.ts's own comments).
 */
export function MetricCard({
  label,
  current,
  unit,
  changePoints,
  changeLabel,
  target,
  status,
  insight,
  actionLabel,
  actionHref,
}: {
  label: string;
  current: number;
  unit: '%' | 'count';
  changePoints?: number;
  changeLabel?: string;
  target: number;
  status: MetricStatus;
  insight: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  const styles = STATUS_STYLES[status];
  const suffix = unit === '%' ? '%' : '';

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-body font-medium text-text-secondary">{label}</span>
        <span className={clsx('rounded-full px-2 py-0.5 text-caption font-medium', styles.badgeBg, styles.badgeText)}>
          {styles.label}
        </span>
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-kpi font-bold text-text-primary">
          {current}
          {suffix}
        </span>
        {changePoints !== undefined && (
          <span
            className={clsx(
              'text-caption font-medium',
              changePoints > 0 ? 'text-success' : changePoints < 0 ? 'text-danger' : 'text-text-secondary',
            )}
          >
            {changePoints > 0 ? '↑' : changePoints < 0 ? '↓' : '—'} {Math.abs(changePoints)}
            {suffix} {changeLabel}
          </span>
        )}
      </div>

      <div className="mb-3 text-caption text-text-secondary">
        Target ≥{target}
        {suffix}
      </div>

      <div className="border-t border-border pt-3 text-caption text-text-secondary">{insight}</div>

      {actionHref && actionLabel && (
        <a href={actionHref} className="mt-2 block text-caption font-medium text-accent hover:underline">
          {actionLabel} →
        </a>
      )}
    </div>
  );
}