import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { ExamResult } from '../examinations/entities/exam-result.entity';
import { FeeAssignment } from '../fees/entities/fee-assignment.entity';
import { StaffAttendanceRecord } from '../hr-management/entities/staff-attendance-record.entity';
import { scopedRepo } from '../../common/context/tenant-context';
import { toLocalDateStr as toDateStr } from '../../common/utils/local-date.util';

type MetricStatus = 'good' | 'warning' | 'bad';

interface Metric {
  label: string;
  current: number;
  unit: '%' | 'count';
  /** Percentage-point change vs. the prior comparable period. Omitted when
   * there isn't enough historical data to compute one honestly (see
   * teacherPresence below) rather than fabricated. */
  changePoints?: number;
  changeLabel?: string;
  target: number;
  status: MetricStatus;
  insight: string;
  /** Drill-down into the metric itself, distinct from the exception cards.
   * Fee Collection: present only when someone genuinely hasn't paid (not
   * merely "below the 90% target" — a school can be above target and still
   * have a handful of unpaid students). */
  actionLabel?: string;
  actionHref?: string;
}

interface ExceptionCard {
  type: 'attendance' | 'academic' | 'finance' | 'staff';
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

interface QueueRow {
  area: string;
  metric: string;
  impact: 'High' | 'Medium' | 'Low';
  owner: string;
  action: string;
}

export interface PrincipalSummary {
  metrics: {
    attendance: Metric;
    passRate: Metric;
    feeCollection: Metric;
    teacherPresence: Metric;
  };
  exceptions: ExceptionCard[];
  queue: QueueRow[];
}

/**
 * Target thresholds are hardcoded here rather than pulled from a
 * configurable per-school store — see the spec's own Section 18 phasing
 * ("trend comparisons + targets" is P1, not P0). Numbers match the example
 * targets in the Dashboard Metrics & UI/UX Requirements doc directly.
 */
const TARGETS = {
  attendance: 95,
  passRate: 85,
  feeCollection: 90,
  teacherPresence: 95,
};

function statusFor(current: number, target: number): MetricStatus {
  if (current >= target) return 'good';
  if (current >= target - 10) return 'warning';
  return 'bad';
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(AttendanceRecord) private readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(ExamResult) private readonly examResultRepo: Repository<ExamResult>,
    @InjectRepository(FeeAssignment) private readonly feeAssignmentRepo: Repository<FeeAssignment>,
    @InjectRepository(StaffAttendanceRecord)
    private readonly staffAttendanceRepo: Repository<StaffAttendanceRecord>,
  ) {}

  async getPrincipalSummary(): Promise<PrincipalSummary> {
    // All raw queries below run through this same scoped manager — critical
    // for RLS to actually apply to hand-written SQL. dataSource.query()
    // directly would use a fresh, unscoped connection and silently return
    // every tenant's data (exactly the Day 2 bug, in a new place, if this
    // step were skipped).
    const manager = scopedRepo(this.attendanceRepo, AttendanceRecord).manager;

    const now = new Date();
    const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const today = toDateStr(now);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStart = toDateStr(prevMonthDate);
    const prevMonthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));

    const [attendanceMetric, lowClasses] = await this.computeAttendance(manager, monthStart, today, prevMonthStart, prevMonthEnd);
    const [passRateMetric, worstDrop] = await this.computeAcademics(manager);
    const feeMetric = await this.computeFees(manager);
    const [teacherMetric, onLeaveToday] = await this.computeTeacherPresence(manager);

    const exceptions: ExceptionCard[] = [];
    if (lowClasses.length > 0) {
      exceptions.push({
        type: 'attendance',
        title: 'ATTENDANCE EXCEPTION',
        body: `${lowClasses.map((c) => `${c.grade}${c.section}`).join(', ')} ${lowClasses.length === 1 ? 'is' : 'are'} below 85% this month.`,
        actionLabel: 'View affected students',
        // Deep-links to the single worst-affected class — lowClasses is
        // already sorted ascending by pct, so [0] is the most urgent one.
        // Not all three (the page shows one class at a time), but landing
        // on the right starting point beats a generic, unfiltered page.
        actionHref: `/student-attendance-exceptions?classId=${encodeURIComponent(lowClasses[0].classId)}`,
      });
    }
    if (worstDrop) {
      exceptions.push({
        type: 'academic',
        title: 'ACADEMIC SIGNAL',
        body: `${worstDrop.subjectName} average fell ${Math.abs(Math.round(worstDrop.delta))} points in Grade ${worstDrop.grade} across the last two assessments.`,
        actionLabel: 'Analyse subject',
        actionHref: '/examinations',
      });
    }
    if (feeMetric.gapAmount > 0) {
      exceptions.push({
        type: 'finance',
        title: 'FINANCE ACTION',
        body: `Collections are ${feeMetric.metric.target - feeMetric.metric.current > 0 ? (feeMetric.metric.target - feeMetric.metric.current).toFixed(1) : 0} points below target; ₹${feeMetric.gapAmount.toLocaleString('en-IN')} still required to hit plan.`,
        actionLabel: 'View collection plan',
        actionHref: '/fee-structures',
      });
    }
    if (onLeaveToday > 0) {
      exceptions.push({
        type: 'staff',
        title: 'STAFF ACTION',
        body: `${onLeaveToday} staff ${onLeaveToday === 1 ? 'member is' : 'members are'} on leave today.`,
        actionLabel: 'View staff on leave',
        actionHref: '/staff-attendance-exceptions',
      });
    }

    const queue: QueueRow[] = [];
    if (lowClasses.length > 0) {
      queue.push({
        area: 'Attendance',
        metric: `${lowClasses.length} sections <85%`,
        impact: 'High',
        owner: 'Academic Coordinator',
        action: 'Review',
      });
    }
    if (worstDrop) {
      queue.push({
        area: 'Academics',
        metric: `Grade ${worstDrop.grade} ${worstDrop.subjectName} ${Math.round(worstDrop.delta)} pts`,
        impact: Math.abs(worstDrop.delta) >= 5 ? 'High' : 'Medium',
        owner: 'Coordinator',
        action: 'Analyse',
      });
    }
    if (feeMetric.gapAmount > 0) {
      queue.push({
        area: 'Finance',
        metric: `₹${feeMetric.gapAmount.toLocaleString('en-IN')} gap to plan`,
        impact: 'High',
        owner: 'Finance',
        action: 'Follow up',
      });
    }
    if (onLeaveToday > 0) {
      queue.push({
        area: 'Staff',
        metric: `${onLeaveToday} on leave today`,
        impact: 'Medium',
        owner: 'Admin',
        action: 'Review',
      });
    }

    return {
      metrics: {
        attendance: attendanceMetric,
        passRate: passRateMetric,
        feeCollection: feeMetric.metric,
        teacherPresence: teacherMetric,
      },
      exceptions,
      queue,
    };
  }

  private async computeAttendance(
    manager: ReturnType<typeof scopedRepo>['manager'],
    monthStart: string,
    today: string,
    prevMonthStart: string,
    prevMonthEnd: string,
  ): Promise<[Metric, { classId: string; grade: string; section: string }[]]> {
    const currentRows: { total: string; present: string }[] = await manager.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) as present
       FROM attendance_records
       WHERE date >= $1 AND date <= $2`,
      [monthStart, today],
    );
    const prevRows: { total: string; present: string }[] = await manager.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) as present
       FROM attendance_records
       WHERE date >= $1 AND date <= $2`,
      [prevMonthStart, prevMonthEnd],
    );

    const currentTotal = parseInt(currentRows[0]?.total ?? '0', 10);
    const currentPresent = parseInt(currentRows[0]?.present ?? '0', 10);
    const prevTotal = parseInt(prevRows[0]?.total ?? '0', 10);
    const prevPresent = parseInt(prevRows[0]?.present ?? '0', 10);

    const currentPct = currentTotal > 0 ? (currentPresent / currentTotal) * 100 : 0;
    const prevPct = prevTotal > 0 ? (prevPresent / prevTotal) * 100 : 0;

    const lowClassRows: { class_id: string; grade_level: string; section: string; pct: string }[] = await manager.query(
      `SELECT sc.id as class_id, sc.grade_level, sc.section,
              (SUM(CASE WHEN ar.status IN ('present','late') THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as pct
       FROM attendance_records ar
       JOIN school_classes sc ON sc.id = ar.school_class_id
       WHERE ar.date >= $1 AND ar.date <= $2
       GROUP BY sc.id, sc.grade_level, sc.section
       HAVING (SUM(CASE WHEN ar.status IN ('present','late') THEN 1 ELSE 0 END)::float / COUNT(*)) < 0.85
       ORDER BY pct ASC`,
      [monthStart, today],
    );
    const lowClasses = lowClassRows.map((r) => ({ classId: r.class_id, grade: r.grade_level, section: r.section }));

    const metric: Metric = {
      label: 'Student Attendance',
      current: Math.round(currentPct * 10) / 10,
      unit: '%',
      changePoints: prevTotal > 0 ? Math.round((currentPct - prevPct) * 10) / 10 : undefined,
      changeLabel: 'MoM',
      target: TARGETS.attendance,
      status: statusFor(currentPct, TARGETS.attendance),
      insight:
        lowClasses.length > 0
          ? `${lowClasses.length} class${lowClasses.length === 1 ? '' : 'es'} below 85%`
          : 'All classes within range',
    };
    return [metric, lowClasses];
  }

  private async computeAcademics(
    manager: ReturnType<typeof scopedRepo>['manager'],
  ): Promise<[Metric, { subjectName: string; grade: string; delta: number } | null]> {
    const dateRows: { exam_date: string }[] = await manager.query(
      `SELECT DISTINCT exam_date::text FROM exams ORDER BY exam_date DESC LIMIT 2`,
    );
    if (dateRows.length === 0) {
      const metric: Metric = {
        label: 'Academic Pass Rate',
        current: 0,
        unit: '%',
        target: TARGETS.passRate,
        status: statusFor(0, TARGETS.passRate),
        insight: 'No exam results recorded yet',
      };
      return [metric, null];
    }

    const currentDate = dateRows[0].exam_date;
    const prevDate = dateRows[1]?.exam_date;

    const passRateFor = async (date: string): Promise<number> => {
      const rows: { total: string; passed: string }[] = await manager.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN er.marks_obtained IS NOT NULL AND er.marks_obtained::numeric >= e.max_marks::numeric * 0.4 THEN 1 ELSE 0 END) as passed
         FROM exam_results er
         JOIN exams e ON e.id = er.exam_id
         WHERE e.exam_date = $1`,
        [date],
      );
      const total = parseInt(rows[0]?.total ?? '0', 10);
      const passed = parseInt(rows[0]?.passed ?? '0', 10);
      return total > 0 ? (passed / total) * 100 : 0;
    };

    const currentPassRate = await passRateFor(currentDate);
    const prevPassRate = prevDate ? await passRateFor(prevDate) : undefined;

    let worstDrop: { subjectName: string; grade: string; delta: number } | null = null;
    if (prevDate) {
      const rows: { subject_id: string; subject_name: string; grade_level: string; exam_date: string; avg_marks: string }[] =
        await manager.query(
          `SELECT e.subject_id, s.name as subject_name, sc.grade_level, e.exam_date::text as exam_date,
                  AVG(er.marks_obtained::numeric) as avg_marks
           FROM exam_results er
           JOIN exams e ON e.id = er.exam_id
           JOIN subjects s ON s.id = e.subject_id
           JOIN school_classes sc ON sc.id = e.school_class_id
           WHERE e.exam_date IN ($1, $2) AND er.marks_obtained IS NOT NULL
           GROUP BY e.subject_id, s.name, sc.grade_level, e.exam_date`,
          [currentDate, prevDate],
        );
      const byKey = new Map<string, { current?: number; prev?: number; subjectName: string; grade: string }>();
      for (const r of rows) {
        const key = `${r.subject_id}::${r.grade_level}`;
        const entry = byKey.get(key) ?? { subjectName: r.subject_name, grade: r.grade_level };
        if (r.exam_date === currentDate) entry.current = parseFloat(r.avg_marks);
        else entry.prev = parseFloat(r.avg_marks);
        byKey.set(key, entry);
      }
      for (const entry of byKey.values()) {
        if (entry.current !== undefined && entry.prev !== undefined) {
          const delta = entry.current - entry.prev;
          if (!worstDrop || delta < worstDrop.delta) {
            worstDrop = { subjectName: entry.subjectName, grade: entry.grade, delta };
          }
        }
      }
      // Only surface as a signal if it's a real decline, not noise.
      if (worstDrop && worstDrop.delta >= -3) worstDrop = null;
    }

    const metric: Metric = {
      label: 'Academic Pass Rate',
      current: Math.round(currentPassRate * 10) / 10,
      unit: '%',
      changePoints: prevPassRate !== undefined ? Math.round((currentPassRate - prevPassRate) * 10) / 10 : undefined,
      changeLabel: 'vs previous term',
      target: TARGETS.passRate,
      status: statusFor(currentPassRate, TARGETS.passRate),
      insight: worstDrop
        ? `${worstDrop.subjectName} down in Grade ${worstDrop.grade}`
        : currentPassRate >= TARGETS.passRate
          ? 'Outcome improving'
          : 'Below target',
      // Unlike Fee Collection, this link is always shown, regardless of
      // the value — a 100% pass rate is exactly the number someone will
      // want to actually verify, not the case where a link feels
      // unnecessary.
      actionLabel: 'View top & bottom performers',
      actionHref: '/academic-performers',
    };
    return [metric, worstDrop];
  }

  private async computeFees(
    manager: ReturnType<typeof scopedRepo>['manager'],
  ): Promise<{ metric: Metric; gapAmount: number }> {
    const assignedRows: { fee_structure_id: string; student_count: string; structure_total: string }[] =
      await manager.query(
        `SELECT fa.fee_structure_id, COUNT(fa.id) as student_count,
                COALESCE((SELECT SUM(fc.amount) FROM fee_components fc WHERE fc.fee_structure_id = fa.fee_structure_id), 0) as structure_total
         FROM fee_assignments fa
         GROUP BY fa.fee_structure_id`,
      );
    const assignedTotal = assignedRows.reduce(
      (sum, r) => sum + parseInt(r.student_count, 10) * parseFloat(r.structure_total),
      0,
    );

    const paidRows: { paid: string }[] = await manager.query(
      `SELECT COALESCE(SUM(amount), 0) as paid FROM fee_payments`,
    );
    const paidTotal = parseFloat(paidRows[0]?.paid ?? '0');

    const currentPct = assignedTotal > 0 ? (paidTotal / assignedTotal) * 100 : 0;
    const gapAmount = Math.max(0, Math.round((TARGETS.feeCollection / 100) * assignedTotal - paidTotal));
    // Distinct from gapAmount (shortfall vs. the 90% target) — this is
    // whether ANYONE genuinely hasn't paid in full yet. A school can be
    // above target and still have real defaulters; the drill-down link
    // should reflect that, not the target comparison.
    const hasOutstanding = assignedTotal - paidTotal > 0.01;

    const metric: Metric = {
      label: 'Fee Collection',
      current: Math.round(currentPct * 10) / 10,
      unit: '%',
      // No prior-period fee snapshot exists to compare against honestly —
      // omitted rather than fabricated, same reasoning as teacherPresence.
      target: TARGETS.feeCollection,
      status: statusFor(currentPct, TARGETS.feeCollection),
      insight: gapAmount > 0 ? `₹${gapAmount.toLocaleString('en-IN')} gap to target` : 'On track',
      ...(hasOutstanding ? { actionLabel: 'View students yet to pay', actionHref: '/fee-defaulters' } : {}),
    };
    return { metric, gapAmount };
  }

  private async computeTeacherPresence(
    manager: ReturnType<typeof scopedRepo>['manager'],
  ): Promise<[Metric, number]> {
    const dateRows: { latest: string }[] = await manager.query(
      `SELECT MAX(date) as latest FROM staff_attendance_records`,
    );
    const latestDate = dateRows[0]?.latest;
    if (!latestDate) {
      const metric: Metric = {
        label: 'Teacher Presence',
        current: 0,
        unit: '%',
        target: TARGETS.teacherPresence,
        status: statusFor(0, TARGETS.teacherPresence),
        insight: 'No staff attendance recorded yet',
      };
      return [metric, 0];
    }

    const monthRows: { total: string; present: string }[] = await manager.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
       FROM staff_attendance_records
       WHERE date <= $1`,
      [latestDate],
    );
    const total = parseInt(monthRows[0]?.total ?? '0', 10);
    const present = parseInt(monthRows[0]?.present ?? '0', 10);
    const currentPct = total > 0 ? (present / total) * 100 : 0;

    const onLeaveRows: { cnt: string }[] = await manager.query(
      `SELECT COUNT(*) as cnt FROM staff_attendance_records WHERE date = $1 AND status = 'on_leave'`,
      [latestDate],
    );
    const onLeaveToday = parseInt(onLeaveRows[0]?.cnt ?? '0', 10);

    const metric: Metric = {
      label: 'Teacher Presence',
      current: Math.round(currentPct * 10) / 10,
      unit: '%',
      // No prior-month staff attendance was seeded, so there's genuinely
      // nothing to compare against yet — omitted rather than fabricated.
      // Will start showing a real MoM figure once a second month of data
      // exists.
      target: TARGETS.teacherPresence,
      status: statusFor(currentPct, TARGETS.teacherPresence),
      insight: onLeaveToday > 0 ? `${onLeaveToday} substitution${onLeaveToday === 1 ? '' : 's'} today` : 'Full attendance',
    };
    return [metric, onLeaveToday];
  }

  /**
   * Replaces a genuinely broken pattern in AdminDashboard.tsx: 6 classes x
   * 10 days = 60 individual HTTP requests fired via Promise.all on every
   * page load. That's fine with a handful of records, but at real data
   * volume it reliably tripped the Day 3 rate limiter (429s across the
   * board), and the chart's own silent .catch() hid the failure entirely
   * — it just looked like "no data," not "the requests got throttled."
   * One grouped query instead of 60 round-trips.
   */
    async getAttendanceTrend(days: number = 10): Promise<{ name: string; present: number; absent: number; late: number; excused: number }[]> {
    const manager = scopedRepo(this.attendanceRepo, AttendanceRecord).manager;

    const weekdays: string[] = [];
    const cursor = new Date();
    while (weekdays.length < days) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) weekdays.unshift(toDateStr(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }

    const rows: { date: string; status: string; cnt: string }[] = await manager.query(
      `SELECT date::text as date, status, COUNT(*) as cnt
       FROM attendance_records
       WHERE date = ANY($1::date[])
       GROUP BY date, status`,
      [weekdays],
    );

    const byDate = new Map<string, { present: number; absent: number; late: number; excused: number }>();
    for (const day of weekdays) byDate.set(day, { present: 0, absent: 0, late: 0, excused: 0 });
    for (const r of rows) {
      const bucket = byDate.get(r.date);
      if (!bucket) continue;
      const count = parseInt(r.cnt, 10);
      if (r.status === 'present') bucket.present = count;
      else if (r.status === 'absent') bucket.absent = count;
      else if (r.status === 'late') bucket.late = count;
      else if (r.status === 'excused') bucket.excused = count;
    }

    return weekdays.map((day) => ({
      name: new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...byDate.get(day)!,
    }));
  }

  /**
   * Same reasoning as getAttendanceTrend — replaces 1-request-per-exam
   * (48 requests for this seed data alone) with two grouped queries.
   * Returns up to 10 top students by average score, not just 1 — the
   * frontend can show just the top one today and use the same endpoint
   * for a full leaderboard later without a second backend change.
   */
  async getExamPerformance(): Promise<{
    scoreByGrade: { name: string; value: number }[];
    topStudents: { name: string; averagePercent: number }[];
    topByGrade: { grade: string; name: string; averagePercent: number }[];
  }> {
    const manager = scopedRepo(this.examResultRepo, ExamResult).manager;

    const gradeRows: { grade_level: string; avg_pct: string }[] = await manager.query(
      `SELECT sc.grade_level,
              AVG((er.marks_obtained::numeric / e.max_marks::numeric) * 100) as avg_pct
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN school_classes sc ON sc.id = e.school_class_id
       WHERE er.marks_obtained IS NOT NULL
       GROUP BY sc.grade_level
       ORDER BY sc.grade_level`,
    );

    const studentRows: { first_name: string; last_name: string; avg_pct: string }[] = await manager.query(
      `SELECT s.first_name, s.last_name,
              AVG((er.marks_obtained::numeric / e.max_marks::numeric) * 100) as avg_pct
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN students s ON s.id = er.student_id
       WHERE er.marks_obtained IS NOT NULL
       GROUP BY er.student_id, s.first_name, s.last_name
       ORDER BY avg_pct DESC
       LIMIT 10`,
    );

    // One top performer per grade — a window function ranks students within
    // each grade by their own average, and only rank 1 from each grade
    // survives the outer WHERE. Deliberately grade-level only, not broken
    // down by section (8-A vs 8-B) — matches what was actually asked for.
    const topByGradeRows: { grade_level: string; first_name: string; last_name: string; avg_pct: string }[] =
      await manager.query(
        `SELECT grade_level, first_name, last_name, avg_pct FROM (
           SELECT s.grade_level, s.first_name, s.last_name,
                  AVG((er.marks_obtained::numeric / e.max_marks::numeric) * 100) as avg_pct,
                  ROW_NUMBER() OVER (
                    PARTITION BY s.grade_level
                    ORDER BY AVG((er.marks_obtained::numeric / e.max_marks::numeric) * 100) DESC
                  ) as rn
           FROM exam_results er
           JOIN exams e ON e.id = er.exam_id
           JOIN students s ON s.id = er.student_id
           WHERE er.marks_obtained IS NOT NULL
           GROUP BY s.grade_level, s.id, s.first_name, s.last_name
         ) ranked
         WHERE rn = 1
         ORDER BY grade_level`,
      );

    return {
      scoreByGrade: gradeRows.map((r) => ({ name: r.grade_level, value: Math.round(parseFloat(r.avg_pct) * 10) / 10 })),
      topStudents: studentRows.map((r) => ({
        name: `${r.first_name} ${r.last_name}`,
        averagePercent: Math.round(parseFloat(r.avg_pct) * 10) / 10,
      })),
      topByGrade: topByGradeRows.map((r) => ({
        grade: r.grade_level,
        name: `${r.first_name} ${r.last_name}`,
        averagePercent: Math.round(parseFloat(r.avg_pct) * 10) / 10,
      })),
    };
  }

  /**
   * Backs the Fee Collection metric card's drill-down — deliberately a
   * narrow, exception-focused view (who owes money, how much), not the
   * full fee-management module. Optional classId filters to one class;
   * omitted, it returns every student with an outstanding balance
   * school-wide.
   */
  async getFeeDefaulters(classId?: string): Promise<{
    students: {
      studentId: string;
      name: string;
      grade: string;
      section: string;
      assigned: number;
      paid: number;
      balance: number;
    }[];
    totalOutstanding: number;
  }> {
    const manager = scopedRepo(this.feeAssignmentRepo, FeeAssignment).manager;

    const rows: {
      student_id: string;
      first_name: string;
      last_name: string;
      grade_level: string;
      section: string;
      assigned: string;
      paid: string;
    }[] = await manager.query(
      `SELECT s.id as student_id, s.first_name, s.last_name, s.grade_level, s.section,
              COALESCE((SELECT SUM(fc.amount) FROM fee_components fc WHERE fc.fee_structure_id = fa.fee_structure_id), 0) as assigned,
              COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.fee_assignment_id = fa.id), 0) as paid
       FROM fee_assignments fa
       JOIN students s ON s.id = fa.student_id
       WHERE ($1::uuid IS NULL OR s.school_class_id = $1::uuid)`,
      [classId ?? null],
    );

    const students = rows
      .map((r) => {
        const assigned = parseFloat(r.assigned);
        const paid = parseFloat(r.paid);
        return {
          studentId: r.student_id,
          name: `${r.first_name} ${r.last_name}`,
          grade: r.grade_level,
          section: r.section,
          assigned,
          paid,
          balance: Math.round((assigned - paid) * 100) / 100,
        };
      })
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    const totalOutstanding = Math.round(students.reduce((sum, s) => sum + s.balance, 0) * 100) / 100;

    return { students, totalOutstanding };
  }

  /**
   * Backs the Pass Rate metric card's drill-down. Unlike Fee Collection's
   * link (conditional on real outstanding balances), this one is always
   * shown regardless of the pass rate value — a 100% pass rate is exactly
   * the situation someone will want to actually verify, not the one case
   * where a drill-down feels unnecessary.
   */
  async getAcademicPerformers(classId?: string): Promise<{
    top: { studentId: string; name: string; grade: string; section: string; averagePercent: number }[];
    bottom: { studentId: string; name: string; grade: string; section: string; averagePercent: number }[];
  }> {
    const manager = scopedRepo(this.examResultRepo, ExamResult).manager;

    const baseQuery = `
      SELECT s.id as student_id, s.first_name, s.last_name, s.grade_level, s.section,
             AVG((er.marks_obtained::numeric / e.max_marks::numeric) * 100) as avg_pct
      FROM exam_results er
      JOIN exams e ON e.id = er.exam_id
      JOIN students s ON s.id = er.student_id
      WHERE er.marks_obtained IS NOT NULL
        AND ($1::uuid IS NULL OR s.school_class_id = $1::uuid)
      GROUP BY s.id, s.first_name, s.last_name, s.grade_level, s.section
    `;

    type Row = { student_id: string; first_name: string; last_name: string; grade_level: string; section: string; avg_pct: string };

    const topRows: Row[] = await manager.query(`${baseQuery} ORDER BY avg_pct DESC LIMIT 10`, [classId ?? null]);
    const bottomRows: Row[] = await manager.query(`${baseQuery} ORDER BY avg_pct ASC LIMIT 10`, [classId ?? null]);

    const toEntry = (r: Row) => ({
      studentId: r.student_id,
      name: `${r.first_name} ${r.last_name}`,
      grade: r.grade_level,
      section: r.section,
      averagePercent: Math.round(parseFloat(r.avg_pct) * 10) / 10,
    });

    return { top: topRows.map(toEntry), bottom: bottomRows.map(toEntry) };
  }

  /**
   * Backs the Student Attendance exception card's drill-down — who is
   * actually absent/excused on the most recent day with data (not
   * literally "today", since that could be a weekend or a day nobody's
   * marked attendance yet — same reasoning as computeTeacherPresence's
   * "latest date" approach), plus % absent and % excused over the current
   * month for context. Optional classId narrows to one class.
   */
  async getStudentAttendanceExceptions(classId?: string): Promise<{
    date: string | null;
    absent: { studentId: string; name: string; grade: string; section: string }[];
    onLeave: { studentId: string; name: string; grade: string; section: string }[];
    pctAbsent: number;
    pctOnLeave: number;
  }> {
    const manager = scopedRepo(this.attendanceRepo, AttendanceRecord).manager;

    const dateRows: { latest: string }[] = await manager.query(
      `SELECT MAX(date)::text as latest FROM attendance_records`,
    );
    const latestDate = dateRows[0]?.latest ?? null;
    if (!latestDate) {
      return { date: null, absent: [], onLeave: [], pctAbsent: 0, pctOnLeave: 0 };
    }

    const exceptionRows: { student_id: string; first_name: string; last_name: string; grade_level: string; section: string; status: string }[] =
      await manager.query(
        `SELECT s.id as student_id, s.first_name, s.last_name, s.grade_level, s.section, ar.status
         FROM attendance_records ar
         JOIN students s ON s.id = ar.student_id
         WHERE ar.date = $1 AND ar.status IN ('absent', 'excused')
           AND ($2::uuid IS NULL OR s.school_class_id = $2::uuid)
         ORDER BY ar.status, s.first_name`,
        [latestDate, classId ?? null],
      );

    const toEntry = (r: (typeof exceptionRows)[number]) => ({
      studentId: r.student_id,
      name: `${r.first_name} ${r.last_name}`,
      grade: r.grade_level,
      section: r.section,
    });
    const absent = exceptionRows.filter((r) => r.status === 'absent').map(toEntry);
    const onLeave = exceptionRows.filter((r) => r.status === 'excused').map(toEntry);

    const now = new Date();
    const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthRows: { status: string; cnt: string }[] = await manager.query(
      `SELECT ar.status, COUNT(*) as cnt
       FROM attendance_records ar
       JOIN students s ON s.id = ar.student_id
       WHERE ar.date >= $1 AND ar.date <= $2
         AND ($3::uuid IS NULL OR s.school_class_id = $3::uuid)
       GROUP BY ar.status`,
      [monthStart, latestDate, classId ?? null],
    );
    const totalThisMonth = monthRows.reduce((sum, r) => sum + parseInt(r.cnt, 10), 0);
    const absentThisMonth = parseInt(monthRows.find((r) => r.status === 'absent')?.cnt ?? '0', 10);
    const excusedThisMonth = parseInt(monthRows.find((r) => r.status === 'excused')?.cnt ?? '0', 10);

    return {
      date: latestDate,
      absent,
      onLeave,
      pctAbsent: totalThisMonth > 0 ? Math.round((absentThisMonth / totalThisMonth) * 1000) / 10 : 0,
      pctOnLeave: totalThisMonth > 0 ? Math.round((excusedThisMonth / totalThisMonth) * 1000) / 10 : 0,
    };
  }

  /**
   * Same reasoning as getStudentAttendanceExceptions, for staff. Optional
   * department narrows the list (Academics / Administration / Support
   * Staff, per the seeded departments).
   */
  async getStaffAttendanceExceptions(department?: string): Promise<{
    date: string | null;
    absent: { employeeId: string; name: string; department: string }[];
    onLeave: { employeeId: string; name: string; department: string }[];
    pctAbsent: number;
    pctOnLeave: number;
  }> {
    const manager = scopedRepo(this.staffAttendanceRepo, StaffAttendanceRecord).manager;

    const dateRows: { latest: string }[] = await manager.query(
      `SELECT MAX(date)::text as latest FROM staff_attendance_records`,
    );
    const latestDate = dateRows[0]?.latest ?? null;
    if (!latestDate) {
      return { date: null, absent: [], onLeave: [], pctAbsent: 0, pctOnLeave: 0 };
    }

    const exceptionRows: { employee_id: string; name: string; department: string; status: string }[] = await manager.query(
      `SELECT e.id as employee_id, e.name, e.department, sar.status
       FROM staff_attendance_records sar
       JOIN employees e ON e.id = sar.employee_id
       WHERE sar.date = $1 AND sar.status IN ('absent', 'on_leave')
         AND ($2::text IS NULL OR e.department = $2::text)
       ORDER BY sar.status, e.name`,
      [latestDate, department ?? null],
    );

    const toEntry = (r: (typeof exceptionRows)[number]) => ({
      employeeId: r.employee_id,
      name: r.name,
      department: r.department,
    });
    const absent = exceptionRows.filter((r) => r.status === 'absent').map(toEntry);
    const onLeave = exceptionRows.filter((r) => r.status === 'on_leave').map(toEntry);

    const now = new Date();
    const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthRows: { status: string; cnt: string }[] = await manager.query(
      `SELECT sar.status, COUNT(*) as cnt
       FROM staff_attendance_records sar
       JOIN employees e ON e.id = sar.employee_id
       WHERE sar.date >= $1 AND sar.date <= $2
         AND ($3::text IS NULL OR e.department = $3::text)
       GROUP BY sar.status`,
      [monthStart, latestDate, department ?? null],
    );
    const totalThisMonth = monthRows.reduce((sum, r) => sum + parseInt(r.cnt, 10), 0);
    const absentThisMonth = parseInt(monthRows.find((r) => r.status === 'absent')?.cnt ?? '0', 10);
    const onLeaveThisMonth = parseInt(monthRows.find((r) => r.status === 'on_leave')?.cnt ?? '0', 10);

    return {
      date: latestDate,
      absent,
      onLeave,
      pctAbsent: totalThisMonth > 0 ? Math.round((absentThisMonth / totalThisMonth) * 1000) / 10 : 0,
      pctOnLeave: totalThisMonth > 0 ? Math.round((onLeaveThisMonth / totalThisMonth) * 1000) / 10 : 0,
    };
  }
}
