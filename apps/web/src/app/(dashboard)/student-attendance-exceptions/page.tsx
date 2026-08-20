'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserX, CalendarOff } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { SchoolClass } from '@/lib/types';

interface ExceptionRow {
  studentId: string;
  name: string;
  grade: string;
  section: string;
}

function ExceptionList({ rows, emptyLabel }: { rows: ExceptionRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-body text-text-secondary">{emptyLabel}</p>;
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => (
        <div key={r.studentId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div className="text-body font-medium text-text-primary">{r.name}</div>
          <div className="text-caption text-text-secondary">
            Grade {r.grade}
            {r.section ? ` - ${r.section}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentAttendanceExceptionsPage() {
  const user = auth.getUser();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') ?? '');
  const [date, setDate] = useState<string | null>(null);
  const [absent, setAbsent] = useState<ExceptionRow[]>([]);
  const [onLeave, setOnLeave] = useState<ExceptionRow[]>([]);
  const [pctAbsent, setPctAbsent] = useState(0);
  const [pctOnLeave, setPctOnLeave] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.getClasses(user.tenantId).catch(() => []).then((c) => setClasses(c ?? []));
  }, [user?.tenantId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getStudentAttendanceExceptions(selectedClassId || undefined)
      .then((data) => {
        if (cancelled) return;
        setDate(data.date);
        setAbsent(data.absent);
        setOnLeave(data.onLeave);
        setPctAbsent(data.pctAbsent);
        setPctOnLeave(data.pctOnLeave);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load attendance exceptions');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  return (
    <>
      <TopBar
        title="Student Attendance Exceptions"
        description={date ? `Absences and leave for ${date}, plus % this month.` : 'Absences and leave, plus % this month.'}
      />
      <div className="space-y-5 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Grade {c.grade_level}
                  {c.section ? ` - ${c.section}` : ''}
                </option>
              ))}
            </select>
          </div>

          {!loading && (
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-caption text-text-secondary">% absent this month</div>
                <div className="text-card-title font-bold text-danger">{pctAbsent}%</div>
              </div>
              <div>
                <div className="text-caption text-text-secondary">% on leave this month</div>
                <div className="text-card-title font-bold text-warning">{pctOnLeave}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Absent">
            {loading ? (
              <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-1.5 text-caption text-danger">
                  <UserX size={14} /> {absent.length} student{absent.length === 1 ? '' : 's'}
                </div>
                <ExceptionList rows={absent} emptyLabel="No absences recorded." />
              </>
            )}
          </Card>

          <Card title="On Leave">
            {loading ? (
              <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-1.5 text-caption text-warning">
                  <CalendarOff size={14} /> {onLeave.length} student{onLeave.length === 1 ? '' : 's'}
                </div>
                <ExceptionList rows={onLeave} emptyLabel="No one on leave." />
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
