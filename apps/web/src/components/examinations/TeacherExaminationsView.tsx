'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FileCheck2, Layers, Plus, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { AcademicYear, Exam, ExamResult, SchoolClass, Student, Subject } from '@/lib/types';
import { ExamGroupBuilder } from '@/components/examinations/ExamGroupBuilder';
import { ExamGroupsList } from '@/components/examinations/ExamGroupsList';

export function TeacherExaminationsView({ tenantId }: { tenantId: string }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  // Empty array means unscoped (Admin, or a Teacher with no timetable
  // assignments yet) — the create-form dropdowns below fall back to the
  // full classes/subjects lists in that case, same "unscoped" convention
  // used everywhere findClassSubjectPairsForTeacher's result is consumed.
  const [myClassSubjects, setMyClassSubjects] = useState<{ school_class_id: string; subject_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('');

  const [showBulkBuilder, setShowBulkBuilder] = useState(false);
  const [groupsRefreshKey, setGroupsRefreshKey] = useState(0);

  // Filters for the Exams list — narrow down instead of scrolling a wall of cards.
  const [filterName, setFilterName] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');

  const [selectedExamId, setSelectedExamId] = useState('');
  const [roster, setRoster] = useState<Student[]>([]);
  const [existingResults, setExistingResults] = useState<Record<string, ExamResult>>({});
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [absentDraft, setAbsentDraft] = useState<Record<string, boolean>>({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSaved, setMarksSaved] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.getExams(tenantId),
      api.getClasses(tenantId),
      api.getSubjects(tenantId),
      api.getAcademicYears(tenantId),
      // Best-effort — an Admin viewing this same component (if ever
      // reused outside the Teacher role) still works fine with the
      // fallback empty array; no need to fail the whole load over it.
      api.getMyClassSubjects().catch(() => []),
    ])
      .then(([e, c, s, y, pairs]) => {
        setExams(e);
        setClasses(c);
        setSubjects(s);
        setAcademicYears(y);
        setMyClassSubjects(pairs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const currentYear = academicYears.find((y) => y.is_current) ?? academicYears[0];
      if (!currentYear) {
        setError('No academic year exists yet — create one under Settings first.');
        setSaving(false);
        return;
      }
      await api.createExam({
        tenant_id: tenantId,
        subject_id: subjectId,
        school_class_id: classId,
        academic_year_id: currentYear.id,
        name,
        exam_date: examDate,
        max_marks: maxMarks,
      });
      setShowForm(false);
      setName('');
      setSubjectId('');
      setClassId('');
      setExamDate('');
      setMaxMarks('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  }

  function handleGroupCreated() {
    load();
    setGroupsRefreshKey((k) => k + 1);
  }

  async function handleSelectExam(exam: Exam) {
    setSelectedExamId(exam.id);
    setMarksSaved(false);
    const [students, results] = await Promise.all([
      api.getStudents(tenantId, { schoolClassId: exam.school_class_id }),
      api.getExamResults(exam.id),
    ]);
    const activeRoster = students.filter((s) => !['withdrawn', 'transferred', 'graduated', 'alumni', 'duplicate'].includes(s.status));
    setRoster(activeRoster);
    const byStudent: Record<string, ExamResult> = {};
    const draft: Record<string, string> = {};
    const absentInit: Record<string, boolean> = {};
    results.forEach((r) => {
      byStudent[r.student_id] = r;
      if (r.marks_obtained != null) {
        draft[r.student_id] = r.marks_obtained;
      } else {
        absentInit[r.student_id] = true;
      }
    });
    setExistingResults(byStudent);
    setMarksDraft(draft);
    setAbsentDraft(absentInit);
  }

  async function handleSaveMarks() {
    setSavingMarks(true);
    setError(null);
    try {
      const entries = roster.map((s) => ({
        student_id: s.id,
        marks_obtained: absentDraft[s.id] ? undefined : marksDraft[s.id],
      }));
      await api.enterMarks(selectedExamId, entries);
      setMarksSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  }

  function subjectName(id: string) {
    return subjects.find((s) => s.id === id)?.name ?? '—';
  }
  function className(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : '—';
  }

  const uniqueExamNames = useMemo(() => Array.from(new Set(exams.map((e) => e.name))).sort(), [exams]);

  // Filter dropdown options are deliberately derived from `exams` — which
  // is already scoped server-side to this teacher's own classes via
  // TimetableSlot assignments (see ExamsService.findAllForTenant) — rather
  // than from the full tenant-wide `subjects`/`classes` lists. This means
  // every option shown is guaranteed to actually match something, instead
  // of a Teacher being able to pick a class/subject they don't teach and
  // silently landing on "No exams match these filters." Deliberately NOT
  // applied to the New Exam / create-exam form's Subject/Class dropdowns
  // above, which still need the full list (a class the teacher teaches
  // but hasn't yet created any exam for wouldn't appear here, but they
  // still need to be able to pick it to create that very first exam).
  const availableFilterSubjects = useMemo(() => {
    const ids = new Set(exams.map((e) => e.subject_id));
    return subjects.filter((s) => ids.has(s.id));
  }, [exams, subjects]);

  const availableFilterClasses = useMemo(() => {
    const ids = new Set(exams.map((e) => e.school_class_id));
    return classes.filter((c) => ids.has(c.id));
  }, [exams, classes]);

  // "New Exam" create-form dropdown scoping — DELIBERATELY different from
  // the filter dropdowns above. Those can safely derive options from the
  // teacher's own already-scoped `exams`, since a filter option only
  // matters if something could match it. This form needs to offer a
  // class/subject combination even when the teacher has ZERO existing
  // exams for it yet (e.g. their very first exam in that class) — so it
  // uses the real timetable-backed lookup (myClassSubjects) instead.
  //
  // An empty myClassSubjects array means unscoped (Admin, or a Teacher
  // with no timetable assignments) — falls back to the full lists in that
  // case, same convention as everywhere else this signal is consumed.
  const createFormClasses = useMemo(() => {
    if (myClassSubjects.length === 0) return classes;
    const ids = new Set(myClassSubjects.map((p) => p.school_class_id));
    return classes.filter((c) => ids.has(c.id));
  }, [myClassSubjects, classes]);

  // Subject options CASCADE off the currently-selected class — a teacher
  // covering Math in Class A and English in Class B should only see Math
  // as a valid subject while Class A is selected, not "any subject I
  // teach anywhere." Falls back to the full subject list when unscoped,
  // or when no class has been picked yet (nothing to cascade from).
  const createFormSubjects = useMemo(() => {
    if (myClassSubjects.length === 0 || !classId) return subjects;
    const ids = new Set(
      myClassSubjects.filter((p) => p.school_class_id === classId).map((p) => p.subject_id),
    );
    return subjects.filter((s) => ids.has(s.id));
  }, [myClassSubjects, subjects, classId]);

  // If the selected class changes and the previously-selected subject is
  // no longer valid for it, clear it rather than silently leaving a
  // stale, now-invalid selection in place.
  useEffect(() => {
    if (myClassSubjects.length === 0 || !classId || !subjectId) return;
    const stillValid = myClassSubjects.some((p) => p.school_class_id === classId && p.subject_id === subjectId);
    if (!stillValid) setSubjectId('');
  }, [classId, myClassSubjects, subjectId]);

  const filteredExams = useMemo(() => {
    return exams
      .filter((e) => (filterName ? e.name === filterName : true))
      .filter((e) => (filterSubjectId ? e.subject_id === filterSubjectId : true))
      .filter((e) => (filterClassId ? e.school_class_id === filterClassId : true))
      .sort((a, b) => (a.exam_date < b.exam_date ? 1 : -1));
  }, [exams, filterName, filterSubjectId, filterClassId]);

  const filtersActive = !!filterName || !!filterSubjectId || !!filterClassId;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      <Card
        title="Exams"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowBulkBuilder((s) => !s);
                setShowForm(false);
              }}
              className="flex items-center gap-1.5 rounded-button border border-border bg-white px-4 py-2 text-body font-medium text-text-primary hover:bg-canvas"
            >
              <Layers size={16} /> Bulk Create
            </button>
            <Button
              onClick={() => {
                setShowForm((s) => !s);
                setShowBulkBuilder(false);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} /> New Exam
            </Button>
          </div>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Exam Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mid-Term Exam"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {createFormSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Class</label>
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {createFormClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.grade_level}
                    {c.section ? ` - ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Exam Date</label>
              <input
                required
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Max Marks</label>
              <input
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                placeholder="100"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving…' : 'Save Exam'}
              </Button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All Exam Names</option>
            {uniqueExamNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All Subjects</option>
            {availableFilterSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All Classes</option>
            {availableFilterClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade_level}
                {c.section ? ` - ${c.section}` : ''}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              onClick={() => {
                setFilterName('');
                setFilterSubjectId('');
                setFilterClassId('');
              }}
              className="rounded-button border border-border px-3 py-2 text-body text-text-secondary hover:bg-canvas"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : exams.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No exams yet.</p>
        ) : filteredExams.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No exams match these filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Exam Name</th>
                  <th className="py-2 px-3 font-medium">Subject</th>
                  <th className="py-2 px-3 font-medium">Class</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr
                    key={exam.id}
                    onClick={() => handleSelectExam(exam)}
                    className={
                      selectedExamId === exam.id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 text-body font-medium text-text-primary">
                        <FileCheck2 size={15} className="shrink-0 text-accent" />
                        {exam.name}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-body text-text-primary">{subjectName(exam.subject_id)}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{className(exam.school_class_id)}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{exam.exam_date}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{exam.max_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showBulkBuilder && (
        <ExamGroupBuilder
          tenantId={tenantId}
          academicYears={academicYears}
          subjects={subjects}
          classes={classes}
          onCreated={handleGroupCreated}
          onCancel={() => setShowBulkBuilder(false)}
        />
      )}

      <ExamGroupsList
        tenantId={tenantId}
        subjects={subjects}
        classes={classes}
        refreshKey={groupsRefreshKey}
      />

      {selectedExamId && (
        <Card
          title="Enter Marks"
          action={
            <Button onClick={handleSaveMarks} disabled={savingMarks} className="flex items-center gap-1.5">
              <Save size={16} /> {savingMarks ? 'Saving…' : 'Save Marks'}
            </Button>
          }
        >
          {marksSaved && (
            <div className="mb-4 rounded-card border border-success/20 bg-success/10 p-3 text-body text-success">
              Marks saved.
            </div>
          )}
          {roster.length === 0 ? (
            <p className="text-body text-text-secondary">No students in this class yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Roll #</th>
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Marks</th>
                  <th className="py-2 pr-4 font-medium">Absent</th>
                </tr>
              </thead>
              <tbody>
                {roster
                  .slice()
                  .sort((a, b) => (a.roll_number ?? 999) - (b.roll_number ?? 999))
                  .map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-mono text-body text-text-secondary">{s.roll_number ?? '—'}</td>
                      <td className="py-2 pr-4 text-body text-text-primary">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          disabled={absentDraft[s.id]}
                          value={marksDraft[s.id] ?? ''}
                          onChange={(e) => setMarksDraft({ ...marksDraft, [s.id]: e.target.value })}
                          className="w-24 rounded-button border border-border px-2 py-1 font-mono text-body disabled:bg-canvas disabled:text-text-secondary"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="checkbox"
                          checked={!!absentDraft[s.id]}
                          onChange={(e) => setAbsentDraft({ ...absentDraft, [s.id]: e.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}