'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { DayOfWeek, SchoolClass, Subject, TimetableSlot, User } from '@/lib/types';

interface TimetableRequirement {
  school_class_id: string;
  subject_id: string;
  teacher_id: string;
  periods_per_week: number;
}
interface UnscheduledRequirement {
  requirement: TimetableRequirement;
  periods_placed: number;
  periods_requested: number;
}
interface GenerateScheduleResult {
  created: TimetableSlot[];
  unscheduled: UnscheduledRequirement[];
}
interface BulkRow {
  periods_per_week: number;
  teacher_id: string;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetablePage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject_id: '', teacher_id: '', day_of_week: 'monday' as DayOfWeek, period_number: 1 });

  const [electiveGenerating, setElectiveGenerating] = useState(false);
  const [electiveResult, setElectiveResult] = useState<{
    created: number;
    perClass: { school_class_id: string; periods_placed: number; periods_requested: number }[];
  } | null>(null);

  const [showOptimizer, setShowOptimizer] = useState(false);
  const [requirements, setRequirements] = useState<TimetableRequirement[]>([]);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkRows, setBulkRows] = useState<Record<string, BulkRow>>({});
  const [optimizerDays, setOptimizerDays] = useState<DayOfWeek[]>(DAYS);
  const [periodsPerDay, setPeriodsPerDay] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateScheduleResult | null>(null);
  const [subjectTeacherSuggestions, setSubjectTeacherSuggestions] = useState<Record<string, string>>({});
  const [teacherSubjectByTeacherId, setTeacherSubjectByTeacherId] = useState<Record<string, string>>({});
  // Inverse of teacherSubjectByTeacherId — every teacher specialized in a
  // given subject (usually 1, occasionally 2+ for high-demand subjects
  // like Math/English per the one-teacher-one-subject convention). Used to
  // restrict each subject row's Teacher dropdown to only the relevant
  // specialist(s), instead of every active Teacher regardless of subject.
  const [teacherIdsBySubjectId, setTeacherIdsBySubjectId] = useState<Record<string, string[]>>({});
  const [teacherOccupancy, setTeacherOccupancy] = useState<{ teacher_id: string; day_of_week: DayOfWeek; period_number: number }[]>([]);

  function loadReferenceData() {
    if (!user) return;
    Promise.all([api.getClasses(user.tenantId!), api.getSubjects(user.tenantId!)])
      .then(([c, s]) => {
        setClasses(c);
        setSubjects(s);
        if (c.length > 0 && !selectedClassId) setSelectedClassId(c[0].id);
      })
      .catch((err) => setError(err.message));

    // Only Active users with the actual 'Teacher' role are offered here —
    // previously this listed EVERY active user regardless of role (e.g. a
    // School Admin could be picked as a class's subject teacher), and an
    // Inactive teacher shouldn't be assignable to a new slot either
    // (existing slots for a teacher who's since gone Inactive are
    // surfaced separately via the Users page's reassignment prompt, not
    // silently hidden here).
    Promise.all([api.getUsers(user.tenantId!), api.getRoles(user.tenantId!)])
      .then(([allUsers, allRoles]) => {
        const teacherRole = allRoles.find((r) => r.name === 'Teacher');
        const activeTeachers = teacherRole
          ? allUsers.filter((u) => u.status === 'active' && u.role_id === teacherRole.id)
          : [];
        setTeachers(activeTeachers);
      })
      .catch(() => setTeachers([]));

    // Suggestions are built from declared Teacher Subject Specializations
    // (Academics -> Subjects -> "Teacher Subject Assignments") FIRST, since
    // that's a teacher's actual declared specialization and exists before
    // any timetable is ever generated. getTeachersBySubject (existing
    // timetable_slots) is used only as a fallback for a subject with no
    // declared specialization yet, so a subject a teacher has already been
    // slotted into informally still gets suggested too.
    Promise.all([
      api.getTeacherSpecializations(user.tenantId!),
      api.getTeachersBySubject(user.tenantId!),
    ])
      .then(([specializations, pairs]) => {
        const suggestions: Record<string, string> = {};
        pairs.forEach((p) => {
          if (!suggestions[p.subject_id]) suggestions[p.subject_id] = p.teacher_id;
        });
        // Specializations take priority — overwrite any slot-history fallback.
        specializations.forEach((s) => {
          suggestions[s.subject_id] = s.teacher_id;
        });
        setSubjectTeacherSuggestions(suggestions);

        // Previously declared but never populated — teacherSubjectByTeacherId
        // (teacher -> their one subject) is what buildFreshBulkRows uses to
        // prefer a class's own Class Teacher for a row when they specialize
        // in that subject.
        const byTeacher: Record<string, string> = {};
        const bySubject: Record<string, string[]> = {};
        specializations.forEach((s) => {
          byTeacher[s.teacher_id] = s.subject_id;
          if (!bySubject[s.subject_id]) bySubject[s.subject_id] = [];
          bySubject[s.subject_id].push(s.teacher_id);
        });
        setTeacherSubjectByTeacherId(byTeacher);
        setTeacherIdsBySubjectId(bySubject);
      })
      .catch(() => {
        setSubjectTeacherSuggestions({});
        setTeacherSubjectByTeacherId({});
        setTeacherIdsBySubjectId({});
      });

    api.getTeacherOccupancy(user.tenantId!).then(setTeacherOccupancy).catch(() => setTeacherOccupancy([]));
  }

  useEffect(loadReferenceData, [user?.tenantId]);

  function loadSlots() {
    if (!selectedClassId) return;
    setLoading(true);
    api
      .getTimetableForClass(selectedClassId)
      .then(setSlots)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadSlots, [selectedClassId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedClassId) return;
    setSaving(true);
    setError(null);
    try {
      await api.createTimetableSlot({
        tenant_id: user.tenantId!,
        school_class_id: selectedClassId,
        subject_id: form.subject_id,
        teacher_id: form.teacher_id,
        day_of_week: form.day_of_week,
        period_number: form.period_number,
      });
      setShowForm(false);
      loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add timetable slot');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTimetableSlot(id);
      loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete slot');
    }
  }

  /**
   * Whole-grade bulk requirement entry (session 27, replacing a one-row-
   * at-a-time class+subject+teacher+periods form): picking a class resets
   * bulkRows to a fresh zeroed entry per EVERY subject in the tenant, so
   * an admin sets periods/week + teacher for the subjects that actually
   * apply and leaves the rest at 0 (skipped), instead of adding 6-8
   * subjects one at a time.
   */
  // Auto-fills ONLY the one subject this class's own Class Teacher
  // specializes in (e.g. Soumi Das, Grade 1-A's Class Teacher, is
  // pre-selected for Mathematics if that's her specialization) — every
  // other subject is left blank for an explicit Admin pick, even when a
  // specialist exists (the dropdown's OPTIONS are still restricted to
  // that subject's specialist(s) via teacherIdsBySubjectId, just not
  // auto-selected).
  // Electives are excluded entirely from this regular per-subject flow —
  // they're handled exclusively by the "Auto-Assign Elective Periods"
  // tenant-wide tool (see the Elective Periods card below), which is the
  // only path that checks conflicts ACROSS classes, not just within one.
  // Scheduling French/German/Spanish through this normal flow would give
  // each its own separate period again, exactly the old behavior this
  // was built to replace.
  const nonElectiveSubjects = subjects.filter((s) => !s.is_elective);

  function buildFreshBulkRows(classId: string): Record<string, BulkRow> {
    const selectedClass = classes.find((c) => c.id === classId);
    const classTeacherId = selectedClass?.class_teacher_id;
    const classTeacherSubjectId = classTeacherId ? teacherSubjectByTeacherId[classTeacherId] : undefined;
    const fresh: Record<string, BulkRow> = {};
    nonElectiveSubjects.forEach((s) => {
      const preferred = classTeacherId && classTeacherSubjectId === s.id ? classTeacherId : '';
      fresh[s.id] = { periods_per_week: 0, teacher_id: preferred };
    });
    return fresh;
  }

  function handleBulkClassChange(classId: string) {
    setBulkClassId(classId);
  }

  // Rebuilds bulkRows whenever the selected class changes OR the
  // teacher-specialization/suggestion data finishes loading — fixes the
  // race where selecting a class before getTeacherSpecializations()
  // resolves left every row stuck on "Select" with no way to self-correct
  // short of a manual reload.
  useEffect(() => {
    if (!bulkClassId) return;
    setBulkRows(buildFreshBulkRows(bulkClassId));
  }, [bulkClassId, subjects, teacherSubjectByTeacherId, subjectTeacherSuggestions]);  

  function updateBulkRow(subjectId: string, patch: Partial<BulkRow>) {
    setBulkRows((prev) => ({ ...prev, [subjectId]: { ...prev[subjectId], ...patch } }));
  }

  function addBulkToQueue() {
    if (!bulkClassId) return;
    const newReqs: TimetableRequirement[] = [];
    nonElectiveSubjects.forEach((s) => {
      const row = bulkRows[s.id];
      if (row && row.periods_per_week > 0 && row.teacher_id) {
        newReqs.push({
          school_class_id: bulkClassId,
          subject_id: s.id,
          teacher_id: row.teacher_id,
          periods_per_week: row.periods_per_week,
        });
      }
    });
    if (newReqs.length === 0) return;
    setRequirements((prev) => [...prev, ...newReqs]);
    setBulkRows(buildFreshBulkRows(bulkClassId)); // reset rows for this class back to zero after queuing
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  }

  // Real, reusable, tenant-agnostic auto-placement — replaces the earlier
  // manual "pick a day/period yourself" tool entirely. Operates across
  // EVERY class in the tenant with elective offerings in one shot (not
  // one class at a time), since the whole point is avoiding double-booking
  // the same elective teacher across different classes — see
  // TimetableService.generateElectivePeriods's own doc comment for the
  // full algorithm.
  async function handleGenerateElectivePeriods() {
    if (!user) return;
    setElectiveGenerating(true);
    setElectiveResult(null);
    setError(null);
    try {
      const result = await api.generateElectivePeriods(user.tenantId!);
      setElectiveResult({ created: result.created.length, perClass: result.perClass });
      loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate elective periods');
    } finally {
      setElectiveGenerating(false);
    }
  }

  function toggleOptimizerDay(day: DayOfWeek) {
    setOptimizerDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleGenerate() {
    if (!user || requirements.length === 0) return;
    setGenerating(true);
    setError(null);
    setGenerateResult(null);
    try {
      const result = await api.generateTimetable({
        tenant_id: user.tenantId!,
        requirements,
        days: optimizerDays.length > 0 ? optimizerDays : undefined,
        periods_per_day: periodsPerDay,
      });
      setGenerateResult(result);
      setRequirements([]);
      loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  }

  function slotsFor(day: DayOfWeek, period: number) {
    return slots.filter((s) => s.day_of_week === day && s.period_number === period);
  }

  function subjectName(id: string) {
    return subjects.find((s) => s.id === id)?.code ?? '—';
  }

  function teacherName(id: string) {
    return teachers.find((t) => t.id === id)?.name ?? 'Unknown';
  }

  function className(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : '—';
  }

  function freePeriodsForTeacher(teacherId: string): number {
    const totalPossible = optimizerDays.length * periodsPerDay;
    const occupied = teacherOccupancy.filter(
      (o) =>
        o.teacher_id === teacherId &&
        optimizerDays.includes(o.day_of_week) &&
        o.period_number <= periodsPerDay,
    ).length;
    return Math.max(0, totalPossible - occupied);
  }

  const bulkQueueCount = subjects.filter((s) => (bulkRows[s.id]?.periods_per_week ?? 0) > 0).length;

  return (
    <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <Card title="Select a Class">
          {classes.length === 0 ? (
            <p className="text-body text-text-secondary">No classes yet — create one in the Classes tab first.</p>
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
        </Card>

        {selectedClassId && (
          <Card
            title="Weekly Schedule"
            action={
              canManage && (
                <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
                  <Plus size={16} /> Add Slot
                </Button>
              )
            }
          >
            {showForm && canManage && (
              <form
                onSubmit={handleCreate}
                className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-4"
              >
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Subject</label>
                  <select
                    required
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="">Select</option>
                    {nonElectiveSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Teacher</label>
                  <select
                    required
                    value={form.teacher_id}
                    onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                    disabled={!form.subject_id}
                    className="w-full rounded-button border border-border px-3 py-2 text-body disabled:opacity-50"
                  >
                    <option value="">{form.subject_id ? 'Select' : 'Select a subject first'}</option>
                    {teachers
                      .filter((t) => !form.subject_id || (teacherIdsBySubjectId[form.subject_id] ?? []).includes(t.id))
                      .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Day</label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value as DayOfWeek })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Period</label>
                  <select
                    value={form.period_number}
                    onChange={(e) => setForm({ ...form, period_number: Number(e.target.value) })}
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Add to Timetable'}
                  </Button>
                </div>
              </form>
            )}

            {loading ? (
              <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-caption text-text-secondary">
                      <th className="py-2 pr-4 font-medium">Period</th>
                      {DAYS.map((d) => (
                        <th key={d} className="py-2 pr-4 font-medium capitalize">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4 text-body font-medium text-text-secondary">{period}</td>
                        {DAYS.map((day) => {
                          const cellSlots = slotsFor(day, period);
                          const isElective = cellSlots.length > 1;
                          return (
                            <td key={day} className="py-2 pr-4">
                              {cellSlots.length > 0 ? (
                                <div className="rounded-button bg-accent-light px-2 py-1.5 text-caption">
                                  {isElective && (
                                    <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent/70">
                                      Elective
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    {cellSlots.map((slot) => (
                                      <div key={slot.id} className="group relative">
                                        <div className="font-mono font-medium text-accent">
                                          {subjectName(slot.subject_id)}
                                        </div>
                                        <div className="text-text-secondary">{teacherName(slot.teacher_id)}</div>
                                        {canManage && (
                                          <button
                                            onClick={() => handleDelete(slot.id)}
                                            className="absolute right-0 top-0 hidden text-danger group-hover:block"
                                            aria-label="Remove slot"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-button border border-dashed border-border px-2 py-1.5 text-caption text-text-secondary/40">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {canManage && (
          <Card
            title="AI Timetable Optimizer"
            action={
              <Button onClick={() => setShowOptimizer((s) => !s)} className="flex items-center gap-1.5">
                <Sparkles size={16} /> {showOptimizer ? 'Hide' : 'Generate Schedule'}
              </Button>
            }
          >
            {showOptimizer && (
              <div className="space-y-5">
                <p className="text-body text-text-secondary">
                  Pick a class, then set periods/week and a teacher for every subject that needs
                  scheduling — leave a subject at 0 to skip it. Existing timetable slots are always
                  treated as fixed and never overwritten; the optimizer only fills empty periods, and
                  spreads placements across days and periods rather than clustering everything at the
                  same time.
                </p>

                <div className="rounded-card border border-border bg-canvas p-4">
                  <label className="mb-1 block text-caption text-text-secondary">Class</label>
                  <select
                    value={bulkClassId}
                    onChange={(e) => handleBulkClassChange(e.target.value)}
                    className="mb-4 w-full max-w-xs rounded-button border border-border px-3 py-2 text-body"
                  >
                    <option value="">Select a class…</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.grade_level}
                        {c.section ? ` - ${c.section}` : ''}
                      </option>
                    ))}
                  </select>

                  {bulkClassId && subjects.length === 0 && (
                    <p className="text-body text-text-secondary">No subjects exist yet.</p>
                  )}

                  {bulkClassId && subjects.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border text-caption text-text-secondary">
                            <th className="py-2 pr-4 font-medium">Subject</th>
                            <th className="py-2 pr-4 font-medium">Periods/week</th>
                            <th className="py-2 pr-4 font-medium">Teacher</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nonElectiveSubjects.map((s) => {
                            const row = bulkRows[s.id] ?? { periods_per_week: 0, teacher_id: '' };
                            return (
                              <tr key={s.id} className="border-b border-border last:border-0">
                                <td className="py-2 pr-4 text-body">{s.name}</td>
                                <td className="py-2 pr-4">
                                  <input
                                    type="number"
                                    min={0}
                                    max={12}
                                    value={row.periods_per_week}
                                    onChange={(e) =>
                                      updateBulkRow(s.id, { periods_per_week: Number(e.target.value) })
                                    }
                                    className="w-20 rounded-button border border-border px-3 py-1.5 text-body"
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <select
                                    value={row.teacher_id}
                                    onChange={(e) => updateBulkRow(s.id, { teacher_id: e.target.value })}
                                    disabled={row.periods_per_week === 0}
                                    className="w-full max-w-xs rounded-button border border-border px-3 py-1.5 text-body disabled:opacity-50"
                                  >
                                    <option value="">
                                      {(teacherIdsBySubjectId[s.id] ?? []).length === 0
                                        ? 'No teacher specialized in this subject yet'
                                        : 'Select'}
                                    </option>
                                    {teachers
                                      .filter((t) => (teacherIdsBySubjectId[s.id] ?? []).includes(t.id))
                                      .map((t) => {
                                        const free = freePeriodsForTeacher(t.id);
                                        return (
                                          <option key={t.id} value={t.id}>
                                            {t.name} ({free} free)
                                          </option>
                                        );
                                      })}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addBulkToQueue}
                          disabled={bulkQueueCount === 0}
                          className="flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Add {className(bulkClassId)} to Queue
                          {bulkQueueCount > 0 ? ` (${bulkQueueCount})` : ''}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {requirements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-caption font-medium text-text-secondary">
                      {requirements.length} requirement{requirements.length === 1 ? '' : 's'} queued
                    </p>
                    {requirements.map((req, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-card border border-border px-3 py-2 text-body"
                      >
                        <span>
                          {className(req.school_class_id)} · {subjectName(req.subject_id)} ·{' '}
                          {teacherName(req.teacher_id)} — {req.periods_per_week}/week
                        </span>
                        <button onClick={() => removeRequirement(i)} className="text-danger hover:opacity-70">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <label className="mb-1 block text-caption text-text-secondary">Days to use</label>
                    <div className="flex gap-3">
                      {DAYS.map((d) => (
                        <label key={d} className="flex items-center gap-1.5 text-caption capitalize">
                          <input
                            type="checkbox"
                            checked={optimizerDays.includes(d)}
                            onChange={() => toggleOptimizerDay(d)}
                          />
                          {d.slice(0, 3)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-caption text-text-secondary">Periods/day</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={periodsPerDay}
                      onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
                      className="w-24 rounded-button border border-border px-3 py-2 text-body"
                    />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={requirements.length === 0 || generating}
                    className="flex items-center gap-1.5"
                  >
                    <Sparkles size={16} /> {generating ? 'Generating…' : 'Run Optimizer'}
                  </Button>
                </div>

                {generateResult && (
                  <div className="space-y-2 rounded-card border border-border bg-canvas p-4">
                    <p className="text-body font-medium text-text-primary">
                      {generateResult.created.length} slot{generateResult.created.length === 1 ? '' : 's'} created
                    </p>
                    {generateResult.unscheduled.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-caption font-medium text-warning">
                          <AlertTriangle size={14} />
                          {generateResult.unscheduled.length} requirement
                          {generateResult.unscheduled.length === 1 ? '' : 's'} could not be fully scheduled
                        </p>
                        {generateResult.unscheduled.map((u, i) => (
                          <p key={i} className="text-caption text-text-secondary">
                            {className(u.requirement.school_class_id)} · {subjectName(u.requirement.subject_id)} ·{' '}
                            {teacherName(u.requirement.teacher_id)}: placed {u.periods_placed} of{' '}
                            {u.periods_requested} requested periods.
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-caption text-success">All requirements fully scheduled.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {canManage && (
          <Card
            title="Elective Periods"
            action={
              <Button onClick={handleGenerateElectivePeriods} disabled={electiveGenerating}>
                {electiveGenerating ? 'Generating…' : 'Auto-Assign Elective Periods'}
              </Button>
            }
          >
            <p className="text-body text-text-secondary">
              Runs across every class in the tenant that has elective offerings at once (not one class
              at a time), so the same language teacher never gets double-booked between two different
              classes. Co-locates every offered elective at one shared day/period per class (target: 3
              periods/week), students splitting by their own elective selection — same model used for
              Greenwood, now a real reusable feature for any tenant.
            </p>

            {electiveResult && (
              <div className="mt-4 rounded-card border border-border bg-canvas p-4">
                <p className="text-body font-medium text-text-primary">
                  {electiveResult.created} slot{electiveResult.created === 1 ? '' : 's'} created across{' '}
                  {electiveResult.perClass.length} class{electiveResult.perClass.length === 1 ? '' : 'es'}
                </p>
                <div className="mt-2 space-y-1">
                  {electiveResult.perClass.map((pc) => (
                    <p key={pc.school_class_id} className="text-caption text-text-secondary">
                      {className(pc.school_class_id)}: {pc.periods_placed} of {pc.periods_requested} periods/week
                      placed
                      {pc.periods_placed < pc.periods_requested && (
                        <span className="ml-1 text-warning">(shortfall — no fully conflict-free slot found)</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
  );
}