'use client';

import { useEffect, useState } from 'react';
import { UserX, CalendarOff } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface ExceptionRow {
  employeeId: string;
  name: string;
  department: string;
}

function ExceptionList({ rows, emptyLabel }: { rows: ExceptionRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-body text-text-secondary">{emptyLabel}</p>;
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => (
        <div key={r.employeeId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div className="text-body font-medium text-text-primary">{r.name}</div>
          <div className="text-caption text-text-secondary">{r.department}</div>
        </div>
      ))}
    </div>
  );
}

export default function StaffAttendanceExceptionsPage() {
  const user = auth.getUser();
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [absent, setAbsent] = useState<ExceptionRow[]>([]);
  const [onLeave, setOnLeave] = useState<ExceptionRow[]>([]);
  const [pctAbsent, setPctAbsent] = useState(0);
  const [pctOnLeave, setPctOnLeave] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api
      .getEmployees(user.tenantId)
      .catch(() => [])
      .then((employees) => {
        const unique = Array.from(new Set((employees ?? []).map((e) => e.department))).sort();
        setDepartments(unique);
      });
  }, [user?.tenantId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getStaffAttendanceExceptions(selectedDepartment || undefined)
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
  }, [selectedDepartment]);

  return (
    <>
      <TopBar
        title="Staff Attendance Exceptions"
        description={date ? `Absences and leave for ${date}, plus % this month.` : 'Absences and leave, plus % this month.'}
      />
      <div className="space-y-5 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
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
                  <UserX size={14} /> {absent.length} staff
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
                  <CalendarOff size={14} /> {onLeave.length} staff
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
