'use client';

import { useMemo, useState } from 'react';
import { CheckSquare, Layers, Pencil, Square, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import {
  AcademicYear,
  CreateExamGroupPayload,
  ExamGroupCellOverride,
  ExamGroupCreateResult,
  SchoolClass,
  Subject,
} from '@/lib/types';

interface SubjectDefault {
  date: string;
  maxMarks: string;
}

interface OverrideDraft {
  date: string;
  maxMarks: string;
}

interface Props {
  tenantId: string;
  academicYears: AcademicYear[];
  subjects: Subject[];
  classes: SchoolClass[];
  onCreated: () => void;
  onCancel: () => void;
}

export function ExamGroupBuilder({ tenantId, academicYears, subjects, classes, onCreated, onCancel }: Props) {
  const currentYear = academicYears.find((y) => y.is_current) ?? academicYears[0];

  const [academicYearId, setAcademicYearId] = useState(currentYear?.id ?? '');
  const [groupName, setGroupName] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectDefaults, setSubjectDefaults] = useState<Record<string, SubjectDefault>>({});
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, OverrideDraft>>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamGroupCreateResult | null>(null);

  const gradeGroups = useMemo(() => {
    const map: Record<string, SchoolClass[]> = {};
    classes.forEach((c) => {
      if (!map[c.grade_level]) map[c.grade_level] = [];
      map[c.grade_level].push(c);
    });
    return map;
  }, [classes]);

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(id)) {
        const next = { ...subjectDefaults };
        delete next[id];
        setSubjectDefaults(next);
        return prev.filter((x) => x !== id);
      }
      setSubjectDefaults((prevDefaults) => ({
        ...prevDefaults,
        [id]: prevDefaults[id] ?? { date: '', maxMarks: '100' },
      }));
      return [...prev, id];
    });
  }

  function toggleClass(id: string) {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleGrade(gradeLevel: string) {
    const ids = gradeGroups[gradeLevel].map((c) => c.id);
    const allSelected = ids.every((id) => selectedClassIds.includes(id));
    setSelectedClassIds((prev) =>
      allSelected ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])),
    );
  }

  function toggleAllGrades() {
    const allIds = classes.map((c) => c.id);
    const allSelected = allIds.every((id) => selectedClassIds.includes(id));
    setSelectedClassIds(allSelected ? [] : allIds);
  }

  function cellKey(subjectId: string, classId: string) {
    return `${subjectId}:${classId}`;
  }

  function className(c: SchoolClass) {
    return `${c.grade_level}${c.section ? ` - ${c.section}` : ''}`;
  }

  function saveOverride(subjectId: string, classId: string, draft: OverrideDraft) {
    const key = cellKey(subjectId, classId);
    if (!draft.date && !draft.maxMarks) {
      const next = { ...overrides };
      delete next[key];
      setOverrides(next);
    } else {
      setOverrides({ ...overrides, [key]: draft });
    }
    setEditingCell(null);
  }

  function clearOverride(subjectId: string, classId: string) {
    const next = { ...overrides };
    delete next[cellKey(subjectId, classId)];
    setOverrides(next);
  }

  const totalToCreate = selectedSubjectIds.length * selectedClassIds.length;

  const canSubmit =
    !!academicYearId &&
    !!groupName.trim() &&
    selectedSubjectIds.length > 0 &&
    selectedClassIds.length > 0 &&
    selectedSubjectIds.every((id) => subjectDefaults[id]?.date && subjectDefaults[id]?.maxMarks);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const overridesPayload: ExamGroupCellOverride[] = Object.entries(overrides).map(([key, draft]) => {
        const [subject_id, school_class_id] = key.split(':');
        return {
          subject_id,
          school_class_id,
          date: draft.date || undefined,
          max_marks: draft.maxMarks ? Number(draft.maxMarks) : undefined,
        };
      });

      const payload: CreateExamGroupPayload = {
        tenant_id: tenantId,
        academic_year_id: academicYearId,
        name: groupName,
        subjects: selectedSubjectIds.map((id) => ({
          subject_id: id,
          default_date: subjectDefaults[id].date,
          default_max_marks: Number(subjectDefaults[id].maxMarks),
        })),
        school_class_ids: selectedClassIds,
        overrides: overridesPayload.length > 0 ? overridesPayload : undefined,
      };

      const res = await api.createExamGroup(payload);
      setResult(res);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create exam group');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Card title="Exam Group Created">
        <div className="space-y-4">
          <div className="rounded-card border border-success/20 bg-success/10 p-4 text-body text-success">
            Created {result.created.length} exam{result.created.length === 1 ? '' : 's'} in “{result.group.name}”.
          </div>
          {result.skipped.length > 0 && (
            <div className="rounded-card border border-warning/20 bg-warning/10 p-4">
              <p className="mb-2 text-body font-medium text-text-primary">
                {result.skipped.length} combination{result.skipped.length === 1 ? '' : 's'} skipped:
              </p>
              <ul className="space-y-1 text-caption text-text-secondary">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    {subjects.find((sub) => sub.id === s.subject_id)?.name ?? s.subject_id} ·{' '}
                    {classes.find((c) => c.id === s.school_class_id)
                      ? className(classes.find((c) => c.id === s.school_class_id)!)
                      : s.school_class_id}{' '}
                    — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={onCancel}>Done</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Bulk Create Exams"
      action={
        <button onClick={onCancel} className="rounded-button p-2 hover:bg-canvas" aria-label="Close">
          <X size={18} className="text-text-secondary" />
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
        )}

        {/* Basics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Academic Year</label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Select…</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                  {y.is_current ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-text-secondary">Group Name</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Mid-Term — Term 1"
              className="w-full rounded-button border border-border px-3 py-2 text-body"
            />
          </div>
        </div>

        {/* Subjects */}
        <div>
          <p className="mb-2 text-body-lg font-medium text-text-primary">1. Subjects</p>
          <div className="space-y-2">
            {subjects.map((s) => {
              const selected = selectedSubjectIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  className={
                    selected
                      ? 'rounded-card border border-accent bg-accent-light p-3'
                      : 'rounded-card border border-border p-3'
                  }
                >
                  <button
                    onClick={() => toggleSubject(s.id)}
                    className="flex w-full items-center gap-2 text-left text-body text-text-primary"
                  >
                    {selected ? (
                      <CheckSquare size={18} className="shrink-0 text-accent" />
                    ) : (
                      <Square size={18} className="shrink-0 text-text-secondary" />
                    )}
                    {s.name}
                  </button>
                  {selected && (
                    <div className="mt-3 grid grid-cols-2 gap-3 pl-7">
                      <div>
                        <label className="mb-1 block text-caption text-text-secondary">Default Date</label>
                        <input
                          type="date"
                          value={subjectDefaults[s.id]?.date ?? ''}
                          onChange={(e) =>
                            setSubjectDefaults({
                              ...subjectDefaults,
                              [s.id]: { ...subjectDefaults[s.id], date: e.target.value },
                            })
                          }
                          className="w-full rounded-button border border-border px-3 py-1.5 text-body"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-caption text-text-secondary">Default Max Marks</label>
                        <input
                          value={subjectDefaults[s.id]?.maxMarks ?? ''}
                          onChange={(e) =>
                            setSubjectDefaults({
                              ...subjectDefaults,
                              [s.id]: { ...subjectDefaults[s.id], maxMarks: e.target.value },
                            })
                          }
                          className="w-full rounded-button border border-border px-3 py-1.5 font-mono text-body"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Classes */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-body-lg font-medium text-text-primary">2. Classes</p>
            <button onClick={toggleAllGrades} className="text-caption font-medium text-accent hover:underline">
              {classes.every((c) => selectedClassIds.includes(c.id)) ? 'Clear all' : 'Select all grades'}
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(gradeGroups).map(([grade, classList]) => {
              const allInGrade = classList.every((c) => selectedClassIds.includes(c.id));
              return (
                <div key={grade} className="rounded-card border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-body font-medium text-text-primary">Grade {grade}</span>
                    <button
                      onClick={() => toggleGrade(grade)}
                      className="text-caption font-medium text-accent hover:underline"
                    >
                      {allInGrade ? 'Deselect all sections' : 'Select all sections'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {classList.map((c) => {
                      const selected = selectedClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleClass(c.id)}
                          className={
                            selected
                              ? 'rounded-full bg-accent px-3 py-1 text-caption font-medium text-white'
                              : 'rounded-full border border-border px-3 py-1 text-caption text-text-secondary hover:bg-canvas'
                          }
                        >
                          {className(c)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && (
              <p className="text-body text-text-secondary">No classes set up yet — add classes under Academics first.</p>
            )}
          </div>
        </div>

        {/* Override matrix */}
        {selectedSubjectIds.length > 0 && selectedClassIds.length > 0 && (
          <div>
            <p className="mb-1 text-body-lg font-medium text-text-primary">3. Review &amp; Override (optional)</p>
            <p className="mb-3 text-caption text-text-secondary">
              Every cell uses that subject&apos;s default date/max marks unless you edit it here — only needed if one
              section differs.
            </p>
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                    <th className="py-2 px-3 font-medium">Subject</th>
                    {selectedClassIds.map((classId) => {
                      const c = classes.find((cl) => cl.id === classId);
                      return (
                        <th key={classId} className="py-2 px-3 font-medium">
                          {c ? className(c) : classId}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjectIds.map((subjectId) => {
                    const subject = subjects.find((s) => s.id === subjectId);
                    const defaults = subjectDefaults[subjectId];
                    return (
                      <tr key={subjectId} className="border-b border-border last:border-0">
                        <td className="py-2 px-3 text-body font-medium text-text-primary">{subject?.name}</td>
                        {selectedClassIds.map((classId) => {
                          const key = cellKey(subjectId, classId);
                          const override = overrides[key];
                          const isEditing = editingCell === key;
                          return (
                            <td key={classId} className="py-2 px-3 align-top">
                              {isEditing ? (
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="date"
                                    defaultValue={override?.date ?? defaults?.date}
                                    id={`date-${key}`}
                                    className="w-32 rounded-button border border-border px-2 py-1 text-caption"
                                  />
                                  <input
                                    defaultValue={override?.maxMarks ?? defaults?.maxMarks}
                                    id={`marks-${key}`}
                                    className="w-32 rounded-button border border-border px-2 py-1 font-mono text-caption"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        const dateEl = document.getElementById(`date-${key}`) as HTMLInputElement;
                                        const marksEl = document.getElementById(`marks-${key}`) as HTMLInputElement;
                                        saveOverride(subjectId, classId, {
                                          date: dateEl.value,
                                          maxMarks: marksEl.value,
                                        });
                                      }}
                                      className="text-caption font-medium text-accent hover:underline"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingCell(null)}
                                      className="text-caption text-text-secondary hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      override ? 'text-caption font-medium text-accent' : 'text-caption text-text-secondary'
                                    }
                                  >
                                    {(override?.date ?? defaults?.date) || '—'} ·{' '}
                                    {(override?.maxMarks ?? defaults?.maxMarks) || '—'}
                                  </span>
                                  <button
                                    onClick={() => setEditingCell(key)}
                                    aria-label="Edit this cell"
                                    className="text-text-secondary hover:text-accent"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  {override && (
                                    <button
                                      onClick={() => clearOverride(subjectId, classId)}
                                      aria-label="Clear override"
                                      className="text-text-secondary hover:text-danger"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-body text-text-secondary">
            {totalToCreate > 0
              ? `This will create ${totalToCreate} exam${totalToCreate === 1 ? '' : 's'} (${selectedSubjectIds.length} subject${selectedSubjectIds.length === 1 ? '' : 's'} × ${selectedClassIds.length} class${selectedClassIds.length === 1 ? '' : 'es'}).`
              : 'Pick at least one subject and one class to continue.'}
          </p>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="flex items-center gap-1.5">
            <Layers size={16} /> {submitting ? 'Creating…' : `Create ${totalToCreate || ''} Exams`}
          </Button>
        </div>
      </div>
    </Card>
  );
}