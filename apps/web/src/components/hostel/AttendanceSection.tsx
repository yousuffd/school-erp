'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { HostelAttendanceRecord, Student } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

const STATUS_TONE: Record<HostelAttendanceRecord['status'], 'success' | 'danger' | 'warning'> = {
  present: 'success',
  absent: 'danger',
  on_leave: 'warning',
};

interface DraftEntry {
  student_id: string;
  status: HostelAttendanceRecord['status'];
  curfew_check_in_time: string;
}

export function AttendanceSection({ tenantId }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<HostelAttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<DraftEntry[]>([
    { student_id: '', status: 'present', curfew_check_in_time: '' },
  ]);

  function studentLabel(id: string) {
    const s = students.find((s) => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getHostelAttendanceForDate(tenantId, date), api.getStudents(tenantId)])
      .then(([r, s]) => {
        setRecords(r);
        setStudents(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId, date]);

  function updateEntry(index: number, patch: Partial<DraftEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function addRow() {
    setEntries((prev) => [...prev, { student_id: '', status: 'present', curfew_check_in_time: '' }]);
  }

  function removeRow(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.recordHostelAttendance({
        tenant_id: tenantId,
        date,
        entries: entries
          .filter((e) => e.student_id)
          .map((e) => ({
            student_id: e.student_id,
            status: e.status,
            curfew_check_in_time: e.curfew_check_in_time || undefined,
          })),
      });
      setEntries([{ student_id: '', status: 'present', curfew_check_in_time: '' }]);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Hostel Attendance"
      action={
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-button border border-border px-3 py-2 text-body"
        />
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-5 rounded-card border border-border bg-canvas p-4">
        <div className="mb-3 text-caption font-medium text-text-secondary">
          Record or correct attendance for {date}
        </div>
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={entry.student_id}
                onChange={(e) => updateEntry(i, { student_id: e.target.value })}
                className="flex-1 rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
              <select
                value={entry.status}
                onChange={(e) => updateEntry(i, { status: e.target.value as HostelAttendanceRecord['status'] })}
                className="rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="on_leave">On Leave</option>
              </select>
              <input
                type="time"
                value={entry.curfew_check_in_time}
                onChange={(e) => updateEntry(i, { curfew_check_in_time: e.target.value })}
                className="rounded-button border border-border px-3 py-2 text-body"
                title="Curfew check-in time (optional)"
              />
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="Remove row"
                  className="text-text-secondary hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={addRow} className="flex items-center gap-1.5">
            <Plus size={14} /> Add Row
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Attendance'}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : records.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No attendance recorded for {date}.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Curfew Check-In</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-body text-text-primary">{studentLabel(r.student_id)}</td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
                </td>
                <td className="py-3 pr-4 text-body text-text-secondary">{r.curfew_check_in_time ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}