'use client';

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
}

interface Props {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

/**
 * Shared tooltip for CategoryDonut/CategoryBarChart — matches
 * DESIGN_SYSTEM.md card styling (white bg, border, rounded, subtle shadow)
 * instead of Recharts' plain default tooltip box, which reads as an
 * unstyled browser default next to the rest of this app. Added session 26
 * as part of "make the charts look more premium."
 */
export function ChartTooltip({ active, payload, label }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-button border border-border bg-card px-3 py-2 shadow-card">
      {label && <div className="mb-0.5 text-caption font-medium text-text-primary">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-caption text-text-secondary">
          {p.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />}
          <span>{p.name}:</span>
          <span className="font-medium text-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
