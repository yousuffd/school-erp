'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Save } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { AttendanceRecord, AttendanceStatus, SchoolClass, Student } from '@/lib/types';
import { ParentAttendanceView } from '@/components/attendance/ParentAttendanceView';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; tone: 'success' | 'danger' | 'warning' | 'info' }[] = [
  { value: 'present', label: 'Present', tone: 'success' },
  { value: 'absent', label: 'Absent', tone: 'danger' },
  { value: 'late', label: 'Late', tone: 'warning' },
  { value: 'excused', label: 'Excused', tone: 'info' },
];

// Only exclude students in a terminal/inactive lifecycle state — an
// 'enrolled' student (the default status right after admission, before
// anyone remembers to click "Mark as active") should still show up for
// attendance. Filtering the roster to status==='active' only, as an earlier
// version of this page did, silently hid every freshly admitted student.
const TERMINAL_STATUSES = new Set(['withdrawn', 'transferred', 'graduated', 'alumni', 'duplicate']);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const user = auth.getUser();
  const isParent = user?.role === 'Parent';
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<Student[]>([]);
  const [existing, setExisting] = useState<Record<string, AttendanceRecord>>({});
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .getClasses(user.tenantId!)
      .then((c) => {
        setClasses(c);
        if (c.length > 0 && !selectedClassId) setSelectedClassId(c[0].id);
      })
      .catch((err) => setError(err.message));
  }, [user?.tenantId]);

  useEffect(() => {
    if (!selectedClassId || !user) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    Promise.all([
      api.getStudents(user.tenantId!, { schoolClassId: selectedClassId }),
      api.getAttendanceForClassOnDate(selectedClassId, date),
    ])
      .then(([allInClass, records]) => {
        const roster = allInClass
          .filter((s) => !TERMINAL_STATUSES.has(s.status))
          .sort((a, b) => (a.roll_number ?? 999999) - (b.roll_number ?? 999999));
        setStudents(roster);
        const byStudent: Record<string, AttendanceRecord> = {};
        const draftInit: Record<string, AttendanceStatus> = {};
        records.forEach((r) => {
          byStudent[r.student_id] = r;
          draftInit[r.student_id] = r.status;
        });
        // Default anyone without an existing record to "present" — the
        // common case — rather than leaving the form half-empty.
        roster.forEach((s) => {
          if (!draftInit[s.id]) draftInit[s.id] = 'present';
        });
        setExisting(byStudent);
        setDraft(draftInit);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedClassId, date, user?.tenantId]);

  async function handleSave() {
    if (!user || !selectedClassId) return;
    setSaving(true);
    setError(null);
    try {
      await api.markAttendance({
        tenant_id: user.tenantId!,
        school_class_id: selectedClassId,
        date,
        entries: students.map((s) => ({ student_id: s.id, status: draft[s.id] ?? 'present' })),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  if (isParent) {
    return (
      <>
        <TopBar title="Attendance" description="View your child's attendance record." />
        <div className="p-6">
          <ParentAttendanceView />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Attendance" description="Mark daily attendance for a class roster." />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-card border border-success/20 bg-success/10 p-4 text-body text-success">
            Attendance saved for {date}.
          </div>
        )}

        <Card title="Class & Date">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Class</label>
              {classes.length === 0 ? (
                <p className="text-body text-text-secondary">No classes yet — create one under Academics first.</p>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-button border border-border px-3 py-2 text-body"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade_level}
                      {c.section ? ` - ${c.section}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayISO()}
                className="rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
          </div>
        </Card>

        {selectedClassId && (
          <Card
            title="Roster"
            action={
              students.length > 0 && (
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
                  <Save size={16} /> {saving ? 'Saving…' : 'Save Attendance'}
                </Button>
              )
            }
          >
            {loading ? (
              <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
            ) : students.length === 0 ? (
              <p className="py-6 text-center text-body text-text-secondary">
                No students assigned to this class yet — assign students from their profile page in the
                Student Directory first.
              </p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-caption text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Roll #</th>
                    <th className="py-2 pr-4 font-medium">Student</th>
                    <th className="py-2 pr-4 font-medium">Admission #</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-mono text-body text-text-secondary">
                        {s.roll_number ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 font-medium text-text-primary">
                          <CalendarCheck size={16} className="text-text-secondary" />
                          {s.first_name} {s.last_name}
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-body text-text-secondary">{s.admission_number}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_OPTIONS.map((opt) => {
                            const isSelected = draft[s.id] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setDraft({ ...draft, [s.id]: opt.value })}
                                className="rounded-full"
                              >
                                <Badge tone={isSelected ? opt.tone : 'neutral'}>{opt.label}</Badge>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
