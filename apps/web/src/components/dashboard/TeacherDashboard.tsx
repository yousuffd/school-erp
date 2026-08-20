'use client';

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { groupCounts } from '@/lib/chart-utils';
import { api } from '@/lib/api';
import { Exam, SchoolClass, Subject } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

/**
 * getExams(tenantId) alone is already correctly scoped to just this
 * Teacher's own classes+subjects server-side (see ExamsService.
 * findAllForTenant — the caller's identity is derived from the JWT, no
 * extra param needed here). getMyClassSubjects() is the same
 * self-service pattern, built earlier this session for the Examinations
 * create-form dropdown scoping — reused here directly.
 *
 * "Your Classes & Subjects" stays a chip list, not a chart — it's a small,
 * inherently enumerable set (a handful of class+subject pairs), not
 * something a chart would make clearer. "Your Exams" gets an Exams-by-
 * Class donut for a quick visual read (session 26: real analytics, not
 * just cards/lists), with the detailed table kept below it for the
 * specific names/dates a chart can't show.
 *
 * The "Quick Glance" card reuses classSubjectPairs and exams (already
 * fetched above) to surface upcoming-exam count without a new call.
 */
export function TeacherDashboard({ tenantId }: Props) {
  const [classSubjectPairs, setClassSubjectPairs] = useState<{ school_class_id: string; subject_id: string }[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyClassSubjects(),
      api.getClasses(tenantId),
      api.getSubjects(tenantId),
      api.getExams(tenantId),
    ])
      .then(([pairs, c, s, e]) => {
        setClassSubjectPairs(pairs);
        setClasses(c);
        setSubjects(s);
        setExams(e);
      })
      .catch((err) => setError(err.message ?? 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  function classLabel(id: string): string {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.grade_level}${c.section ? ` - ${c.section}` : ''}` : id;
  }
  function subjectLabel(id: string): string {
    return subjects.find((s) => s.id === id)?.name ?? id;
  }

  const examsByClass = groupCounts(exams, (e) => classLabel(e.school_class_id));
  const today = new Date().toISOString().slice(0, 10);
  const upcomingExams = exams.filter((e) => e.exam_date >= today).length;
  const uniqueClasses = new Set(classSubjectPairs.map((p) => p.school_class_id)).size;

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
          { label: 'Classes assigned', value: uniqueClasses },
          { label: 'Subjects taught', value: classSubjectPairs.length },
          { label: 'Upcoming exams', value: upcomingExams },
        ]}
      />

      <Card title="Your Classes & Subjects">
        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : classSubjectPairs.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No timetable assignments yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classSubjectPairs.map((pair, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-button border border-border px-3 py-2 text-body"
              >
                <BookOpen size={14} className="text-accent" />
                <span className="font-medium text-text-primary">{classLabel(pair.school_class_id)}</span>
                <span className="text-text-secondary">·</span>
                <span className="text-text-secondary">{subjectLabel(pair.subject_id)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Exams by Class">
          {loading ? (
            <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
          ) : examsByClass.length === 0 ? (
            <p className="py-10 text-center text-body text-text-secondary">No exams scheduled yet.</p>
          ) : (
            <CategoryDonut data={examsByClass} centerLabel="Exams" />
          )}
        </Card>

        <Card title="Your Exams" action={<a className="text-body text-accent" href="/examinations">View all →</a>}>
          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : exams.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No exams scheduled yet.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {exams.slice(0, 6).map((exam) => (
                  <tr key={exam.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="text-body font-medium text-text-primary">{exam.name}</div>
                      <div className="text-caption text-text-secondary">
                        {classLabel(exam.school_class_id)} · {subjectLabel(exam.subject_id)}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Badge tone="info">{exam.exam_date}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
