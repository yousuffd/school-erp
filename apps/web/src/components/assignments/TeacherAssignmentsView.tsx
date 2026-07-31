'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, FileText, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { AcademicYear, Assignment, AssignmentSubmission, SchoolClass, Subject } from '@/lib/types';

interface Props {
  tenantId: string;
}

export function TeacherAssignmentsView({ tenantId }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [instructions, setInstructions] = useState('');

  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');

  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.getAssignments(tenantId),
      api.getClasses(tenantId),
      api.getSubjects(tenantId),
      api.getAcademicYears(tenantId),
    ])
      .then(([a, c, s, y]) => {
        setAssignments(a);
        setClasses(c);
        setSubjects(s);
        setAcademicYears(y);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
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
      await api.createAssignment({
        tenant_id: tenantId,
        subject_id: subjectId,
        school_class_id: classId,
        academic_year_id: currentYear.id,
        title,
        instructions: instructions || undefined,
        due_date: new Date(dueDate).toISOString(),
        max_score: Number(maxScore),
      });
      setShowForm(false);
      setTitle('');
      setSubjectId('');
      setClassId('');
      setDueDate('');
      setMaxScore('100');
      setInstructions('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAssignment(assignment: Assignment) {
    setSelectedAssignmentId(assignment.id);
    try {
      const subs = await api.getSubmissionsByAssignment(assignment.id);
      setSubmissions(subs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load submissions');
    }
  }

  async function handleSaveGrade(submissionId: string) {
    setSavingGradeId(submissionId);
    setError(null);
    try {
      const score = Number(scoreDraft[submissionId]);
      await api.gradeSubmission(submissionId, { score, feedback: feedbackDraft[submissionId] || undefined });
      const subs = await api.getSubmissionsByAssignment(selectedAssignmentId);
      setSubmissions(subs);
      setGradingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save grade');
    } finally {
      setSavingGradeId(null);
    }
  }

  function subjectName(id: string) {
    return subjects.find((s) => s.id === id)?.name ?? '—';
  }
  function className(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : '—';
  }

  const filteredAssignments = useMemo(
    () =>
      assignments
        .filter((a) => (filterSubjectId ? a.subject_id === filterSubjectId : true))
        .filter((a) => (filterClassId ? a.school_class_id === filterClassId : true))
        .sort((a, b) => (a.due_date < b.due_date ? 1 : -1)),
    [assignments, filterSubjectId, filterClassId],
  );

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Assignments"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Assignment
          </Button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Homework 1"
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
                {subjects.map((s) => (
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
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.grade_level}
                    {c.section ? ` - ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Due Date &amp; Time</label>
              <input
                required
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Max Score</label>
              <input
                required
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-caption text-text-secondary">Instructions (plain text)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="What should students do for this assignment?"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create Assignment'}
              </Button>
            </div>
          </form>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
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
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade_level}
                {c.section ? ` - ${c.section}` : ''}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : filteredAssignments.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No assignments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Title</th>
                  <th className="py-2 px-3 font-medium">Subject</th>
                  <th className="py-2 px-3 font-medium">Class</th>
                  <th className="py-2 px-3 font-medium">Due</th>
                  <th className="py-2 px-3 font-medium">Max Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => handleSelectAssignment(a)}
                    className={
                      selectedAssignmentId === a.id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{a.title}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{subjectName(a.subject_id)}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{className(a.school_class_id)}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">
                      {new Date(a.due_date).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{a.max_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedAssignment && (
        <Card title={`Submissions — ${selectedAssignment.title}`}>
          {submissions.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="rounded-card border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-accent" />
                      <span className="text-body text-text-primary">{sub.original_filename}</span>
                      {sub.is_late && <Badge tone="warning">Late</Badge>}
                      {sub.graded_at ? (
                        <Badge tone="success">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} /> Graded: {sub.score}/{selectedAssignment.max_score}
                          </span>
                        </Badge>
                      ) : (
                        <Badge tone="info">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Pending
                          </span>
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => api.downloadSubmissionFile(sub.id, sub.original_filename)}
                      className="flex items-center gap-1 text-caption text-accent hover:underline"
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                  {sub.feedback && !gradingId && (
                    <p className="mt-2 text-caption text-text-secondary">Feedback: {sub.feedback}</p>
                  )}
                  {gradingId === sub.id ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        placeholder={`Score (max ${selectedAssignment.max_score})`}
                        value={scoreDraft[sub.id] ?? sub.score ?? ''}
                        onChange={(e) => setScoreDraft({ ...scoreDraft, [sub.id]: e.target.value })}
                        className="rounded-button border border-border px-2 py-1.5 font-mono text-body"
                      />
                      <input
                        placeholder="Feedback (optional)"
                        value={feedbackDraft[sub.id] ?? sub.feedback ?? ''}
                        onChange={(e) => setFeedbackDraft({ ...feedbackDraft, [sub.id]: e.target.value })}
                        className="rounded-button border border-border px-2 py-1.5 text-body sm:col-span-2"
                      />
                      <div className="flex gap-2 sm:col-span-3">
                        <Button
                          onClick={() => handleSaveGrade(sub.id)}
                          disabled={savingGradeId === sub.id}
                        >
                          {savingGradeId === sub.id ? 'Saving…' : 'Save Grade'}
                        </Button>
                        <Button variant="secondary" onClick={() => setGradingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setGradingId(sub.id)}
                      className="mt-2 text-caption font-medium text-accent hover:underline"
                    >
                      {sub.graded_at ? 'Edit Grade' : 'Grade this submission'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}