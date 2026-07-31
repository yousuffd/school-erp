'use client';

import { useEffect, useState } from 'react';
import { ListTodo } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { api } from '@/lib/api';
import { Assignment, Exam, ExamResult } from '@/lib/types';

/**
 * "Your Assignments" stays a list — each row is something the student
 * still needs to actually go DO (open it, submit it), which a chart would
 * only obscure. "Your Exam Results" becomes a real marks-per-exam bar
 * chart instead of a badge list (session 26: real analytics, not just
 * cards/lists) — a score trend across exams is genuinely clearer visually
 * than reading down a column of "X / Y" badges. marks_obtained is stored
 * as a numeric-string (Postgres numeric type), same convention as
 * max_marks elsewhere — parsed here for the chart's numeric axis.
 *
 * The "Quick Glance" card reuses `assignments` and `results` (already
 * fetched above) for a due-this-week count and results summary, no new
 * call.
 */
export function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [results, setResults] = useState<Array<ExamResult & { exam: Exam }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMyAssignments(), api.getMyExamResults()])
      .then(([a, r]) => {
        setAssignments(a);
        setResults(r);
      })
      .catch((err) => setError(err.message ?? 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const marksChartData = results
    .filter((r) => r.marks_obtained !== null && r.marks_obtained !== undefined)
    .map((r) => ({ name: r.exam.name, value: parseFloat(r.marks_obtained as unknown as string) }));

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueThisWeek = assignments.filter((a) => {
    const due = new Date(a.due_date);
    return due >= now && due <= weekFromNow;
  }).length;

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      <GlanceCard
        title="Quick Glance"
        subtitle="Where things stand right now"
        loading={loading}
        rows={[
          { label: 'Assignments due this week', value: dueThisWeek },
          { label: 'Total assignments', value: assignments.length },
          { label: 'Exam results published', value: results.length },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Your Assignments" action={<a className="text-body text-accent" href="/assignments">View all →</a>}>
          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : assignments.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No assignments yet.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {assignments.slice(0, 6).map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2 text-body font-medium text-text-primary">
                        <ListTodo size={14} className="text-accent" />
                        {a.title}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Badge tone="warning">Due {a.due_date}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Your Exam Results" action={<a className="text-body text-accent" href="/examinations">View all →</a>}>
          {loading ? (
            <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
          ) : marksChartData.length === 0 ? (
            <p className="py-10 text-center text-body text-text-secondary">No results published yet.</p>
          ) : (
            <CategoryBarChart data={marksChartData} />
          )}
        </Card>
      </div>
    </div>
  );
}
