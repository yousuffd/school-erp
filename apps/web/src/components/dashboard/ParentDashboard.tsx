'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { api } from '@/lib/api';
import { Exam, ExamResult, Student } from '@/lib/types';

/**
 * getMyLinkedStudents() only returns raw ParentStudentLink rows (id,
 * student_id, ...) — no student name/details. getStudent(id) is called
 * per-link to resolve a display name. A real Parent typically has 1-3
 * children, so N one-off lookups here is fine — not worth a bulk-fetch
 * endpoint for this scale.
 *
 * Exam results use the same marks-per-exam bar chart as StudentDashboard
 * (session 26: real analytics, not just cards/lists) — same component,
 * same reasoning, just for whichever child is currently selected.
 *
 * The "Quick Glance" card reuses `results` (already fetched for the
 * chart) to show a results count and average score for the selected
 * child, no new call.
 */
export function ParentDashboard() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [results, setResults] = useState<Array<ExamResult & { exam: Exam }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    api
      .getMyLinkedStudents()
      .then((links) => Promise.all(links.map((l) => api.getStudent(l.student_id))))
      .then((students) => {
        setChildren(students);
        if (students.length > 0) setSelectedStudentId(students[0].id);
      })
      .catch((err) => setError(err.message ?? 'Failed to load your linked children'))
      .finally(() => setLoadingChildren(false));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    setLoadingResults(true);
    api
      .getMyExamResults(undefined, selectedStudentId)
      .then(setResults)
      .catch((err) => setError(err.message ?? 'Failed to load results'))
      .finally(() => setLoadingResults(false));
  }, [selectedStudentId]);

  const marksChartData = results
    .filter((r) => r.marks_obtained !== null && r.marks_obtained !== undefined)
    .map((r) => ({ name: r.exam.name, value: parseFloat(r.marks_obtained as unknown as string) }));

  const averageScore =
    marksChartData.length > 0
      ? Math.round((marksChartData.reduce((sum, r) => sum + r.value, 0) / marksChartData.length) * 10) / 10
      : null;

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      {loadingChildren ? (
        <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
      ) : children.length === 0 ? (
        <Card title="Your Children">
          <p className="py-6 text-center text-body text-text-secondary">
            No children are linked to your account yet — contact the school office.
          </p>
        </Card>
      ) : (
        <>
          {children.length > 1 && (
            <div className="flex items-center gap-3">
              <Users size={16} className="text-text-secondary" />
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="rounded-button border border-border px-3 py-2 text-body"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <GlanceCard
            title="Quick Glance"
            subtitle={
              children.length === 1
                ? `For ${children[0].first_name}`
                : `For ${children.find((c) => c.id === selectedStudentId)?.first_name ?? 'your child'}`
            }
            loading={loadingResults}
            rows={[
              { label: 'Exams recorded', value: results.length },
              ...(averageScore !== null ? [{ label: 'Average score', value: averageScore }] : []),
            ]}
            emptyMessage="No results published yet."
          />

          <Card
            title={
              children.length === 1
                ? `${children[0].first_name}'s Exam Results`
                : 'Exam Results'
            }
          >
            {loadingResults ? (
              <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
            ) : marksChartData.length === 0 ? (
              <p className="py-10 text-center text-body text-text-secondary">No results published yet.</p>
            ) : (
              <CategoryBarChart data={marksChartData} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
