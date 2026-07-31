'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { BehaviorIncident, PointsBalance, Student } from '@/lib/types';

/**
 * Parent's read-only view of a child's behaviour incidents + points
 * balance — same "separate component per role" convention as
 * ParentExaminationsView, and the same child-resolution pattern
 * (getMyLinkedStudents() returns raw links only, so getStudent(id) is
 * called per-link for a display name). Calls the two dedicated
 * my-child-* backend routes (resolveParentOnlyStudentId-gated), not the
 * general incidents/points-balance routes Admin/Counselor/Teacher use.
 */
export function ParentDisciplineView() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMyLinkedStudents()
      .then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id))))
      .then((students) => {
        setChildren(students);
        if (students.length > 0) setSelectedStudentId(students[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your linked children'))
      .finally(() => setLoadingChildren(false));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    setLoadingDetail(true);
    setError(null);
    Promise.all([
      api.getMyChildIncidents(selectedStudentId),
      api.getMyChildPointsBalance(selectedStudentId),
    ])
      .then(([inc, bal]) => {
        setIncidents(inc);
        setBalance(bal);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load behaviour records'))
      .finally(() => setLoadingDetail(false));
  }, [selectedStudentId]);

  const sorted = useMemo(
    () => incidents.slice().sort((a, b) => (a.incident_date < b.incident_date ? 1 : -1)),
    [incidents],
  );

  if (loadingChildren) {
    return (
      <Card title="Behaviour & Discipline">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card title="Behaviour & Discipline">
        <p className="py-6 text-center text-body text-text-secondary">
          No children are linked to your account yet — contact the school office.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      {children.length > 1 && (
        <div className="flex items-center gap-3">
          <Users size={16} className="text-text-secondary" />
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Card
        title={
          children.length === 1 ? `${children[0].first_name}'s Points Balance` : 'Points Balance'
        }
      >
        {loadingDetail ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : balance ? (
          <div className="flex items-center gap-3 py-2">
            <span
              className={`text-page-title font-bold ${balance.pointsBalance >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {balance.pointsBalance}
            </span>
            <span className="text-body text-text-secondary">
              across {balance.incidentCount} recorded {balance.incidentCount === 1 ? 'incident' : 'incidents'}
            </span>
          </div>
        ) : (
          <p className="py-6 text-center text-body text-text-secondary">No data yet.</p>
        )}
      </Card>

      <Card title={children.length === 1 ? `${children[0].first_name}'s Incidents` : 'Incidents'}>
        {loadingDetail ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No incidents recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Points</th>
                  <th className="py-2 px-3 font-medium">Description</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{i.incident_date}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-body text-text-primary">
                        {i.incident_type === 'merit' ? (
                          <ShieldCheck size={15} className="shrink-0 text-success" />
                        ) : (
                          <ShieldAlert size={15} className="shrink-0 text-danger" />
                        )}
                        {i.incident_type === 'merit' ? 'Merit' : 'Demerit'}
                      </div>
                    </td>
                    <td className={`py-2 px-3 font-mono text-body ${i.points >= 0 ? 'text-success' : 'text-danger'}`}>
                      {i.points > 0 ? `+${i.points}` : i.points}
                    </td>
                    <td className="py-2 px-3 text-body text-text-primary">{i.description}</td>
                    <td className="py-2 px-3">
                      <Badge tone={i.status === 'open' ? 'warning' : i.status === 'escalated' ? 'danger' : 'success'}>
                        {i.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
