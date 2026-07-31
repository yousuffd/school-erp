'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, FileText, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { Assignment, AssignmentSubmission } from '@/lib/types';

export function StudentAssignmentsView() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([api.getMyAssignments(), api.getMySubmissions()])
      .then(([assignmentsList, submissions]) => {
        setAssignments(assignmentsList);
        const byAssignment: Record<string, AssignmentSubmission> = {};
        submissions.forEach((s) => {
          byAssignment[s.assignment_id] = s;
        });
        setSubmissionsByAssignment(byAssignment);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load assignments'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleFileSelected(assignmentId: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(assignmentId);
    setError(null);
    try {
      await api.submitAssignment(assignmentId, file);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit assignment');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  }

  const sorted = useMemo(
    () => assignments.slice().sort((a, b) => (a.due_date < b.due_date ? -1 : 1)),
    [assignments],
  );

  if (loading) {
    return (
      <Card title="My Assignments">
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card title="My Assignments">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No assignments yet for your class.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((assignment) => {
              const submission = submissionsByAssignment[assignment.id];
              const isPastDue = new Date() > new Date(assignment.due_date);
              const isUploading = uploadingId === assignment.id;

              return (
                <div key={assignment.id} className="rounded-card border border-border p-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-body-lg font-medium text-text-primary">{assignment.title}</h3>
                      <p className="text-caption text-text-secondary">
                        Due {new Date(assignment.due_date).toLocaleString()} · Max {assignment.max_score}
                      </p>
                    </div>
                    {submission?.graded_at ? (
                      <Badge tone="success">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} /> Graded: {submission.score}/{assignment.max_score}
                        </span>
                      </Badge>
                    ) : submission ? (
                      <Badge tone="info">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Submitted — awaiting grade
                        </span>
                      </Badge>
                    ) : isPastDue ? (
                      <Badge tone="danger">Not submitted — overdue</Badge>
                    ) : (
                      <Badge tone="warning">Not submitted</Badge>
                    )}
                  </div>

                  {assignment.instructions && (
                    <p className="mb-3 whitespace-pre-wrap text-body text-text-primary">{assignment.instructions}</p>
                  )}

                  {submission && (
                    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-button bg-canvas p-3">
                      <FileText size={16} className="shrink-0 text-accent" />
                      <span className="text-body text-text-primary">{submission.original_filename}</span>
                      {submission.is_late && <Badge tone="warning">Late</Badge>}
                      <button
                        onClick={() => api.downloadSubmissionFile(submission.id, submission.original_filename)}
                        className="flex items-center gap-1 text-caption text-accent hover:underline"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  )}

                  {submission?.feedback && (
                    <div className="mb-3 rounded-button bg-success/10 p-3 text-body text-text-primary">
                      <span className="font-medium text-success">Feedback: </span>
                      {submission.feedback}
                    </div>
                  )}

                  {submission?.graded_at ? (
                    <p className="text-caption text-text-secondary">
                      Graded — this submission can no longer be changed.
                    </p>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-button border border-border px-4 py-2 text-body text-text-primary hover:bg-canvas">
                      <Upload size={14} />
                      {isUploading ? 'Uploading…' : submission ? 'Resubmit File' : 'Submit File'}
                      <input
                        type="file"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => handleFileSelected(assignment.id, e)}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}