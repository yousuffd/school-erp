'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { AttendanceRecord, AttendanceStatus, Student } from '@/lib/types';

const STATUS_TONE: Record<AttendanceStatus, 'success' | 'danger' | 'warning' | 'info'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'info',
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

/**
 * Parent's read-only attendance view — same "separate component per role"
 * convention as ParentExaminationsView/ParentDisciplineView, and the same
 * child-resolution pattern (getMyLinkedStudents() returns raw links only,
 * so getStudent(id) is called per-link for a display name). Calls the
 * dedicated my-child-attendance route, not the general by-student route
 * Teacher/Admin use (which is Teacher-timetable-scoped, not Parent-aware).
 * Student is deliberately NOT given an equivalent self-service route or
 * view here, per explicit scope decision for this module.
 */
export function ParentAttendanceView() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
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
    setLoadingRecords(true);
    setError(null);
    api
      .getMyChildAttendance(selectedStudentId)
      .then(setRecords)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load attendance records'))
      .finally(() => setLoadingRecords(false));
  }, [selectedStudentId]);

  const sorted = useMemo(() => records.slice().sort((a, b) => (a.date < b.date ? 1 : -1)), [records]);

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    return counts;
  }, [records]);

  if (loadingChildren) {
    return (
      <Card title="Attendance">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card title="Attendance">
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

      <Card title={children.length === 1 ? `${children[0].first_name}'s Attendance Summary` : 'Attendance Summary'}>
        {loadingRecords ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((status) => (
              <div key={status}>
                <div className="text-caption text-text-secondary">{STATUS_LABEL[status]}</div>
                <div className="font-mono text-body-lg text-text-primary">{summary[status]}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={children.length === 1 ? `${children[0].first_name}'s Attendance Records` : 'Attendance Records'}>
        {loadingRecords ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No attendance records yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{r.date}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-body text-text-primary">
                        <CalendarCheck size={15} className="shrink-0 text-accent" />
                        <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-body text-text-secondary">{r.notes ?? '—'}</td>
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
