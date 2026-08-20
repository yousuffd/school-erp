import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

type ExceptionType = 'attendance' | 'academic' | 'finance' | 'staff';

const TYPE_ACCENT: Record<ExceptionType, string> = {
  attendance: 'border-l-warning',
  academic: 'border-l-danger',
  finance: 'border-l-danger',
  staff: 'border-l-info',
};

/**
 * Per the spec's "Exception / Insight Cards" pattern (§6 onward) — a
 * short, scannable alert with a reason and a direct link to act on it.
 * Follows the UX Rules for Alerts (§17): text label, not just a color, so
 * the signal doesn't depend on color perception alone.
 */
export function ExceptionCard({
  type,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  type: ExceptionType;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className={clsx('rounded-card border border-border border-l-4 bg-card p-4 shadow-card', TYPE_ACCENT[type])}>
      <div className="mb-1.5 flex items-center gap-2">
        <AlertTriangle size={14} className="text-text-secondary" />
        <span className="text-caption font-semibold uppercase tracking-wide text-text-secondary">{title}</span>
      </div>
      <p className="mb-2 text-body text-text-primary">{body}</p>
      <a href={actionHref} className="text-caption font-medium text-accent hover:underline">
        {actionLabel} →
      </a>
    </div>
  );
}