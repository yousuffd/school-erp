'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Square, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { MealAttendanceRecord, MealHeadcount, MealType, SchoolClass, Student } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MealAttendanceSection({ tenantId }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [classFilter, setClassFilter] = useState('');
  const [alreadyRecorded, setAlreadyRecorded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [headcountFrom, setHeadcountFrom] = useState('');
  const [headcountTo, setHeadcountTo] = useState('');
  const [headcounts, setHeadcounts] = useState<MealHeadcount[]>([]);
  const [loadingHeadcounts, setLoadingHeadcounts] = useState(false);

  function loadRosterData() {
    setLoading(true);
    Promise.all([api.getStudents(tenantId), api.getClasses(tenantId)])
      .then(([s, c]) => {
        setStudents(s);
        setClasses(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  function loadAttendanceForSlot() {
    api
      .getMealAttendance(tenantId, date, mealType)
      .then((records: MealAttendanceRecord[]) => {
        setAlreadyRecorded(new Set(records.map((r) => r.student_id)));
        setSelected(new Set());
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load attendance'));
  }

  useEffect(loadRosterData, [tenantId]);
  useEffect(loadAttendanceForSlot, [tenantId, date, mealType]);

  const visibleStudents = useMemo(
    () => students.filter((s) => (classFilter ? s.school_class_id === classFilter : true)),
    [students, classFilter],
  );

  function toggleStudent(id: string) {
    if (alreadyRecorded.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleStudents.forEach((s) => {
        if (!alreadyRecorded.has(s.id)) next.add(s.id);
      });
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.recordMealAttendance({
        tenant_id: tenantId,
        attendance_date: date,
        meal_type: mealType,
        student_ids: Array.from(selected),
      });
      setNotice(`Recorded ${selected.size} student(s) for ${mealType} on ${date}.`);
      loadAttendanceForSlot();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadHeadcounts(e: FormEvent) {
    e.preventDefault();
    setLoadingHeadcounts(true);
    setError(null);
    try {
      const rows = await api.getMealHeadcounts(tenantId, headcountFrom, headcountTo);
      setHeadcounts(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load headcounts');
    } finally {
      setLoadingHeadcounts(false);
    }
  }

  function studentLabel(s: Student) {
    return `${s.first_name} ${s.last_name} (${s.admission_number})`;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}
      {notice && (
        <div className="rounded-card border border-success/20 bg-success/10 p-4 text-body text-success">{notice}</div>
      )}

      <Card title="Record Meal Attendance">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Meal</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Class Filter</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.grade_level}
                  {c.section ? ` - ${c.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={selectAllVisible}
              className="flex items-center gap-1 text-caption font-medium text-accent hover:underline"
            >
              <CheckSquare size={14} /> Select all visible
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 text-caption font-medium text-text-secondary hover:underline"
            >
              <Square size={14} /> Clear
            </button>
          </div>
          <span className="flex items-center gap-1 text-caption text-text-secondary">
            <Users size={14} /> {selected.size} selected
          </span>
        </div>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto rounded-card border border-border p-2">
            {visibleStudents.map((s) => {
              const isRecorded = alreadyRecorded.has(s.id);
              const isSelected = selected.has(s.id);
              return (
                <label
                  key={s.id}
                  className={
                    isRecorded
                      ? 'flex items-center gap-2 rounded-button px-2 py-1.5 text-body text-text-secondary'
                      : 'flex cursor-pointer items-center gap-2 rounded-button px-2 py-1.5 text-body text-text-primary hover:bg-canvas'
                  }
                >
                  <input
                    type="checkbox"
                    checked={isRecorded || isSelected}
                    disabled={isRecorded}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {studentLabel(s)}
                  {isRecorded && <span className="text-caption text-success">— already recorded</span>}
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <Button onClick={handleSubmit} disabled={saving || selected.size === 0}>
            {saving ? 'Recording…' : `Record Attendance (${selected.size})`}
          </Button>
        </div>
      </Card>

      <Card title="Headcount Summary">
        <form onSubmit={handleLoadHeadcounts} className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">From</label>
            <input
              required
              type="date"
              value={headcountFrom}
              onChange={(e) => setHeadcountFrom(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">To</label>
            <input
              required
              type="date"
              value={headcountTo}
              onChange={(e) => setHeadcountTo(e.target.value)}
              className="rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
          <Button type="submit" disabled={loadingHeadcounts}>
            {loadingHeadcounts ? 'Loading…' : 'Check Headcounts'}
          </Button>
        </form>

        {headcounts.length === 0 ? (
          <p className="py-4 text-center text-body text-text-secondary">
            Pick a date range above to see headcount totals.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Meal</th>
                  <th className="py-2 px-3 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {headcounts.map((h, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{h.attendance_date}</td>
                    <td className="py-2 px-3 capitalize text-body text-text-primary">{h.meal_type}</td>
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{h.count}</td>
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
