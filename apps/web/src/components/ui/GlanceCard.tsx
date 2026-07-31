'use client';

interface GlanceRow {
  label: string;
  value: string | number;
}

interface GlanceCardProps {
  title: string;
  subtitle?: string;
  rows: GlanceRow[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Compact "at a glance" summary: label/value rows in a tinted panel, each
 * value in a small rounded badge. Same visual pattern as the marketing
 * site's role-portal previews, brought into the real dashboards and
 * module views. Deliberately reuses whatever data the calling page has
 * already loaded (or a light call to an endpoint that already exists
 * elsewhere in the app) rather than adding new backend work.
 *
 * Rows sit in a responsive grid rather than stacking full-width — each
 * row is just a label and a small badge, so a full-width row on a wide
 * screen was mostly empty space. 2 columns from tablet width up, 3 from
 * large desktop up, keeps the card compact instead of unnecessarily tall.
 */
export function GlanceCard({ title, subtitle, rows, loading, emptyMessage }: GlanceCardProps) {
  return (
    <div className="rounded-card border border-border bg-canvas p-4">
      <div className="mb-3">
        <h3 className="text-body-lg font-medium text-text-primary">{title}</h3>
        {subtitle && <p className="text-caption text-text-secondary">{subtitle}</p>}
      </div>
      {loading ? (
        <p className="py-4 text-center text-caption text-text-secondary">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-caption text-text-secondary">
          {emptyMessage ?? 'Nothing to show yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-button border border-border bg-card px-3 py-2"
            >
              <span className="text-caption text-text-secondary">{r.label}</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-caption text-accent">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
