'use client';

import { useEffect, useState } from 'react';
import { Save, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { StaffAttendanceRecord, Employee } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

const STATUS_OPTIONS: { value: StaffAttendanceRecord['status']; label: string; tone: 'success' | 'danger' | 'warning' }[] = [
  { value: 'present', label: 'Present', tone: 'success' },
  { value: 'absent', label: 'Absent', tone: 'danger' },
  { value: 'on_leave', label: 'On Leave', tone: 'warning' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Rewritten to match the Student Attendance roster pattern (session:
 * "instead of selecting each staff, toggle status inline, replicate like
 * students"): one row per employee, auto-populated for the selected date,
 * inline status pills instead of a per-row select-and-add-row flow. Single
 * "Save Attendance" batches every employee's status into one
 * recordStaffAttendance call — same bulk-entries shape the old form
 * already used, so no backend changes needed.
 */
export function AttendanceSection({ tenantId }: Props) {
  const [date, setDate] = useState(todayISO());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draft, setDraft] = useState<Record<string, StaffAttendanceRecord['status']>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSaved(false);

    Promise.all([api.getEmployees(tenantId), api.getStaffAttendanceForDate(tenantId, date)])
      .then(([emps, records]) => {
        setEmployees(emps);
        const draftInit: Record<string, StaffAttendanceRecord['status']> = {};
        records.forEach((r) => {
          draftInit[r.employee_id] = r.status;
        });
        // Default anyone without an existing record to "present" — the
        // common case — rather than leaving the form half-empty.
        emps.forEach((e) => {
          if (!draftInit[e.id]) draftInit[e.id] = 'present';
        });
        setDraft(draftInit);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [tenantId, date]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.recordStaffAttendance({
        tenant_id: tenantId,
        date,
        entries: employees.map((e) => ({ employee_id: e.id, status: draft[e.id] ?? 'present' })),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Staff Attendance"
      action={
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            className="rounded-button border border-border px-3 py-2 text-body"
          />
          {employees.length > 0 && (
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
              <Save size={16} /> {saving ? 'Saving…' : 'Save Attendance'}
            </Button>
          )}
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}
      {saved && (
        <div className="mb-4 rounded-card border border-success/20 bg-success/10 p-4 text-body text-success">
          Attendance saved for {date}.
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : employees.length === 0 ? (
        <p className="py-6 text-center text-body text-text-secondary">No employees on record yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-secondary">
              <th className="py-2 pr-4 font-medium">Employee</th>
              <th className="py-2 pr-4 font-medium">Designation</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 font-medium text-text-primary">
                    <UserRound size={16} className="text-text-secondary" />
                    {e.name}
                  </div>
                </td>
                <td className="py-3 pr-4 text-body text-text-secondary">{e.designation}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = draft[e.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setDraft({ ...draft, [e.id]: opt.value })}
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
  );
}
