import { Badge } from './Badge';

type Impact = 'High' | 'Medium' | 'Low';

const IMPACT_TONE: Record<Impact, 'danger' | 'warning' | 'neutral'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
};

export interface QueueRow {
  area: string;
  metric: string;
  impact: Impact;
  owner: string;
  action: string;
}

/** Per the spec's "Operational Queue" pattern — what needs attention, who
 * owns it, and the one action to take. Table, not cards, since it's meant
 * to be scanned as a list, not read one item at a time. */
export function OperationalQueueTable({ rows }: { rows: QueueRow[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-body text-text-secondary">Nothing needs attention right now.</p>;
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-border text-caption text-text-secondary">
          <th className="pb-2 font-medium">Area</th>
          <th className="pb-2 font-medium">Metric / Exception</th>
          <th className="pb-2 font-medium">Impact</th>
          <th className="pb-2 font-medium">Owner</th>
          <th className="pb-2 text-right font-medium">Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-b border-border text-body last:border-0">
            <td className="py-3 font-medium text-text-primary">{row.area}</td>
            <td className="py-3 text-text-secondary">{row.metric}</td>
            <td className="py-3">
              <Badge tone={IMPACT_TONE[row.impact]}>{row.impact}</Badge>
            </td>
            <td className="py-3 text-text-secondary">{row.owner}</td>
            <td className="py-3 text-right">
              <span className="text-caption font-medium text-accent">{row.action}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}