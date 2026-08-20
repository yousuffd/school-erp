'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Building2, CalendarRange, ShieldCheck, Trophy, Users2 } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { ExceptionCard } from '@/components/ui/ExceptionCard';
import { OperationalQueueTable } from '@/components/ui/OperationalQueueTable';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { AttendanceStackedBarChart, type AttendanceBarDatum } from '@/components/charts/AttendanceStackedBarChart';
import { groupCounts } from '@/lib/chart-utils';
import { api } from '@/lib/api';
import { Activity, Award, AcademicYear, Campus, Role, SchoolEvent, Student, User, PrincipalSummary } from '@/lib/types';

interface Props {
  tenantId: string;
}

/**
 * Admin gets the richest dashboard of any role (session 26 decision).
 * Split into two tabs (this session, following feedback that a single
 * long scroll felt too spread out): "Overview" holds the KPI row, Quick
 * Glance totals, and the Campuses list — a fast at-a-glance read.
 * "Analytics" holds every grouped-count chart, including the two new
 * ones added this session (exam performance, activity/sports
 * participation).
 *
 * Exam performance: there's no pass_marks field anywhere in this schema
 * (Exam only has max_marks), so rather than invent an unstored passing
 * threshold, this shows average score % by grade level and a top-student
 * callout instead — both fully derived from real ExamResult data, no
 * assumptions baked in.
 *
 * Sports awards: Award has no category of its own, and SchoolEvent's
 * `result` field (win/loss/draw) is a team-fixture outcome, not an
 * individual winner. The real per-student "who won" signal is Award
 * (title + student + optional event_id). To show SPORTS awards
 * specifically rather than all awards, each award's event_id is traced
 * to its event's linked activity_id, and kept only if that activity's
 * category is 'sport' — computed client-side from getEvents/getActivities
 * (both real, already-existing bulk endpoints), not fabricated.
 *
  * Attendance and exam-performance data both come from dedicated backend
 * aggregate endpoints (/dashboard/attendance-trend, /dashboard/exam-
 * performance) rather than one request per class-per-day or per-exam —
 * the original per-record fetching pattern reliably tripped the Day 3
 * rate limiter at real data volume (60 concurrent requests for a 6-class,
 * 10-day attendance window alone), and failed silently since the
 * catch-and-blank-state error handling gave no visible signal that
 * anything had gone wrong.
 */

function sum(rows: { name: string; value: number }[]): number {
  return rows.reduce((total, r) => total + r.value, 0);
}

type Tab = 'overview' | 'setup' | 'analytics';

export function AdminDashboard({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsByGrade, setStudentsByGrade] = useState<{ name: string; value: number }[]>([]);
  const [studentsByStatus, setStudentsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [admissionsByStage, setAdmissionsByStage] = useState<{ name: string; value: number }[]>([]);
  const [staffByDepartment, setStaffByDepartment] = useState<{ name: string; value: number }[]>([]);
  const [attendanceByDay, setAttendanceByDay] = useState<AttendanceBarDatum[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [procurementByStatus, setProcurementByStatus] = useState<{ name: string; value: number }[]>([]);
  const [usersByRole, setUsersByRole] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [scoreByGrade, setScoreByGrade] = useState<{ name: string; value: number }[]>([]);
  const [topStudent, setTopStudent] = useState<{ name: string; averagePercent: number } | null>(null);
  const [topByGrade, setTopByGrade] = useState<{ grade: string; name: string; averagePercent: number }[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);

  const [participationByCategory, setParticipationByCategory] = useState<{ name: string; value: number }[]>([]);
  const [sportsAwards, setSportsAwards] = useState<Array<Award & { studentName: string }>>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [principalSummary, setPrincipalSummary] = useState<PrincipalSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPrincipalSummary()
      .then(setPrincipalSummary)
      .catch((err) => setSummaryError(err.message ?? 'Failed to load dashboard summary'))
      .finally(() => setSummaryLoading(false));
  }, [tenantId]);

  useEffect(() => {
    Promise.all([
      api.getCampuses(tenantId),
      api.getAcademicYears(tenantId),
      api.getRoles(tenantId),
      api.getUsers(tenantId),
      api.getStudents(tenantId),
      api.getEmployees(tenantId),
      api.getAdmissions(tenantId),
      api.getProcurementRequests(tenantId),
    ])
      .then(([c, y, r, users, studentList, employees, admissions, procurement]) => {
        setCampuses(c);
        setYears(y);
        setRoles(r);
        setStudents(studentList);
        const roleNameById = new Map(r.map((role) => [role.id, role.name]));
        setUsersByRole(groupCounts(users, (u: User) => roleNameById.get(u.role_id) ?? 'Unknown'));
        setStudentsByGrade(groupCounts(studentList, (s) => s.grade_level));
        setStudentsByStatus(groupCounts(studentList, (s) => s.status));
        setAdmissionsByStage(groupCounts(admissions, (a) => a.stage));
        setStaffByDepartment(groupCounts(employees, (e) => e.department));
        setProcurementByStatus(groupCounts(procurement, (p) => p.status));
      })
      .catch((err) => setError(err.message ?? 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;
    setAttendanceLoading(true);
    api
      .getAttendanceTrend()
      .then((data) => {
        if (!cancelled) setAttendanceByDay(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setAttendanceByDay([]);
          setError(err.message ?? 'Failed to load attendance trend');
        }
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Exam performance: fetch every exam, then every exam's results, then
  // roll marks_obtained/max_marks up into a per-grade average and a
  // per-student average to find the top performer.
  useEffect(() => {
    let cancelled = false;
    setExamsLoading(true);
    api
      .getExamPerformance()
      .then((data) => {
        if (cancelled) return;
        setScoreByGrade(data.scoreByGrade);
        setTopStudent(data.topStudents[0] ?? null);
        setTopByGrade(data.topByGrade);
      })
      .catch((err) => {
        if (!cancelled) {
          setScoreByGrade([]);
          setTopStudent(null);
          setTopByGrade([]);
          setError(err.message ?? 'Failed to load exam performance');
        }
      })
      .finally(() => {
        if (!cancelled) setExamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Activities & sports: activity participation by category (roster size
  // per activity, summed by category), and awards traced through to
  // sport-category activities specifically, not just any award.
  useEffect(() => {
    let cancelled = false;
    setActivitiesLoading(true);
    Promise.all([api.getActivities(tenantId), api.getEvents(tenantId), api.getAwards(tenantId)])
      .then(async ([activities, events, awards]: [Activity[], SchoolEvent[], Award[]]) => {
        const rosters = await Promise.all(activities.map((a) => api.getActivityRoster(a.id)));
        if (cancelled) return;

        const categoryCounts = new Map<string, number>();
        activities.forEach((activity, i) => {
          categoryCounts.set(activity.category, (categoryCounts.get(activity.category) ?? 0) + rosters[i].length);
        });
        setParticipationByCategory(
          Array.from(categoryCounts.entries()).map(([name, value]) => ({ name, value }))
        );

        const activityById = new Map(activities.map((a) => [a.id, a]));
        const sportEventIds = new Set(
          events
            .filter((e) => (e.activity_id ? activityById.get(e.activity_id)?.category === 'sport' : false))
            .map((e) => e.id)
        );
        const studentById = new Map(students.map((s) => [s.id, s]));
        const sportsOnly = awards
          .filter((a) => a.event_id && sportEventIds.has(a.event_id))
          .sort((a, b) => (a.awarded_date < b.awarded_date ? 1 : -1))
          .slice(0, 6)
          .map((a) => {
            const student = studentById.get(a.student_id);
            return { ...a, studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown student' };
          });
        setSportsAwards(sportsOnly);
      })
      .catch(() => {
        if (!cancelled) {
          setParticipationByCategory([]);
          setSportsAwards([]);
        }
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, students]);

  const currentYear = years.find((y) => y.is_current);
  const tenantScopedRoles = roles.filter((r) => r.tenant_id !== null);

  return (
    <div className="space-y-5 p-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(['overview', 'setup', 'analytics'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-body font-medium capitalize transition-colors',
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      
      {tab === 'overview' && (
        <div className="space-y-5">
          {summaryError && (
            <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
              {summaryError}
            </div>
          )}

          {!summaryError && (
            <>
              <div>
                <h2 className="mb-3 text-card-title font-semibold text-text-primary">School Health</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {summaryLoading || !principalSummary ? (
                    <p className="col-span-full py-6 text-center text-body text-text-secondary">Loading…</p>
                  ) : (
                    <>
                      <MetricCard {...principalSummary.metrics.attendance} />
                      <MetricCard {...principalSummary.metrics.passRate} />
                      <MetricCard {...principalSummary.metrics.feeCollection} />
                      <MetricCard {...principalSummary.metrics.teacherPresence} />
                    </>
                  )}
                </div>
              </div>

              {!summaryLoading && principalSummary && principalSummary.exceptions.length > 0 && (
                <div>
                  <h2 className="mb-3 text-card-title font-semibold text-text-primary">Needs Attention</h2>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {principalSummary.exceptions.map((exc, idx) => (
                      <ExceptionCard key={idx} {...exc} />
                    ))}
                  </div>
                </div>
              )}

              {!summaryLoading && principalSummary && principalSummary.queue.length > 0 && (
                <Card title="Action Queue">
                  <OperationalQueueTable rows={principalSummary.queue} />
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'setup' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Building2} label="Campuses" value={loading ? '—' : campuses.length} />
            <KpiCard
              icon={CalendarRange}
              label="Academic Years"
              value={loading ? '—' : years.length}
              trend={currentYear ? `${currentYear.label} current` : undefined}
            />
            <KpiCard icon={ShieldCheck} label="Roles Configured" value={loading ? '—' : roles.length} />
            <KpiCard icon={Users2} label="Custom Roles" value={loading ? '—' : tenantScopedRoles.length} />
          </div>

          <GlanceCard
            title="Quick Glance"
            subtitle="Totals across every campus, right now"
            loading={loading}
            rows={[
              { label: 'Total students', value: sum(studentsByGrade) },
              { label: 'Total staff', value: sum(staffByDepartment) },
              { label: 'Admissions in the pipeline', value: sum(admissionsByStage) },
              { label: 'Open procurement requests', value: sum(procurementByStatus) },
            ]}
          />

          <Card
            title="Campuses"
            action={<a className="text-body text-accent" href="/admin/campuses">View all →</a>}
          >
            {campuses.length === 0 && !loading && (
              <p className="py-6 text-center text-body text-text-secondary">
                No campuses yet — add one to get started.
              </p>
            )}
            <table className="w-full text-left">
              <tbody>
                {campuses.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="text-body font-medium text-text-primary">{c.name}</div>
                      <div className="text-caption text-text-secondary">{c.address ?? 'No address on file'}</div>
                    </td>
                    <td className="py-3 text-right">
                      <Badge tone="info">{c.timezone}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title="Students by Grade Level">
              {loading ? (
                <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
              ) : studentsByGrade.length === 0 ? (
                <p className="py-10 text-center text-body text-text-secondary">No students yet.</p>
              ) : (
                <>
                  <CategoryBarChart data={studentsByGrade} multiColor />
                  {studentsByStatus.length > 0 && (
                    <p className="mt-2 text-caption text-text-secondary">
                      {studentsByStatus.map((s) => `${s.value} ${s.name}`).join(' · ')}
                    </p>
                  )}
                </>
              )}
            </Card>

            {/* Hidden entirely rather than shown empty — appears automatically
                once real admissions data exists, no code change needed. */}
            {!loading && admissionsByStage.length > 0 && (
              <Card title="Admissions by Stage">
                <CategoryBarChart data={admissionsByStage} multiColor />
              </Card>
            )}

            <Card title="Staff by Department">
              {loading ? (
                <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
              ) : staffByDepartment.length === 0 ? (
                <p className="py-10 text-center text-body text-text-secondary">No staff records yet.</p>
              ) : (
                <CategoryBarChart data={staffByDepartment} multiColor />
              )}
            </Card>

            <Card title="Attendance by Status (Last 10 School Days)">
              {attendanceLoading ? (
                <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
              ) : attendanceByDay.every((d) => d.present + d.absent + d.late + d.excused === 0) ? (
                <p className="py-10 text-center text-body text-text-secondary">No attendance records yet.</p>
              ) : (
                <AttendanceStackedBarChart data={attendanceByDay} />
              )}
            </Card>

            {!loading && procurementByStatus.length > 0 && (
              <Card title="Procurement Requests by Status">
                <CategoryDonut data={procurementByStatus} centerLabel="Requests" />
              </Card>
            )}

            <Card title="Average Exam Score by Grade Level">
              {examsLoading ? (
                <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
              ) : scoreByGrade.length === 0 ? (
                <p className="py-10 text-center text-body text-text-secondary">No exam results recorded yet.</p>
              ) : (
                <CategoryBarChart data={scoreByGrade} multiColor />
              )}
            </Card>

            <Card title="Top Student by Grade">
              {examsLoading ? (
                <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
              ) : topByGrade.length === 0 ? (
                <p className="py-10 text-center text-body text-text-secondary">No exam results recorded yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {topByGrade.map((entry) => (
                    <div key={entry.grade} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light">
                        <Trophy size={18} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-body font-medium text-text-primary">{entry.name}</div>
                        <div className="text-caption text-text-secondary">Grade {entry.grade}</div>
                      </div>
                      <div className="text-body font-semibold text-text-primary">{entry.averagePercent}%</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-caption text-text-secondary">
                Ranked by average score across every recorded exam, one per grade.
              </p>
            </Card>

            {!activitiesLoading && participationByCategory.length > 0 && (
              <Card title="Activity Participation by Category">
                <CategoryDonut data={participationByCategory} centerLabel="Students" />
              </Card>
            )}

            {!activitiesLoading && sportsAwards.length > 0 && (
              <Card title="Recent Sports Awards">
                <table className="w-full text-left">
                  <tbody>
                    {sportsAwards.map((award) => (
                      <tr key={award.id} className="border-b border-border last:border-0">
                        <td className="py-3">
                          <div className="text-body font-medium text-text-primary">{award.title}</div>
                          <div className="text-caption text-text-secondary">{award.studentName}</div>
                        </td>
                        <td className="py-3 text-right">
                          <Badge tone="info">{award.awarded_date}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            <Card title="Users by Role">
              {loading ? (
                <p className="py-10 text-center text-body text-text-secondary">Loading…</p>
              ) : usersByRole.length === 0 ? (
                <p className="py-10 text-center text-body text-text-secondary">No users yet.</p>
              ) : (
                <CategoryBarChart data={usersByRole} multiColor />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
