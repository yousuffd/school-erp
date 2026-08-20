import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { ExamResult } from '../examinations/entities/exam-result.entity';
import { FeeAssignment } from '../fees/entities/fee-assignment.entity';
import { StaffAttendanceRecord } from '../hr-management/entities/staff-attendance-record.entity';
import { scopedRepo } from '../../common/context/tenant-context';

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

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
        actionLabel: 'View affected sections',
        actionHref: '/attendance',
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
        actionLabel: 'View staff attendance',
        actionHref: '/hr-management',
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
  ): Promise<[Metric, { grade: string; section: string }[]]> {
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

    const lowClassRows: { grade_level: string; section: string; pct: string }[] = await manager.query(
      `SELECT sc.grade_level, sc.section,
              (SUM(CASE WHEN ar.status IN ('present','late') THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as pct
       FROM attendance_records ar
       JOIN school_classes sc ON sc.id = ar.school_class_id
       WHERE ar.date >= $1 AND ar.date <= $2
       GROUP BY sc.id, sc.grade_level, sc.section
       HAVING (SUM(CASE WHEN ar.status IN ('present','late') THEN 1 ELSE 0 END)::float / COUNT(*)) < 0.85
       ORDER BY pct ASC`,
      [monthStart, today],
    );
    const lowClasses = lowClassRows.map((r) => ({ grade: r.grade_level, section: r.section }));

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

    const metric: Metric = {
      label: 'Fee Collection',
      current: Math.round(currentPct * 10) / 10,
      unit: '%',
      // No prior-period fee snapshot exists to compare against honestly —
      // omitted rather than fabricated, same reasoning as teacherPresence.
      target: TARGETS.feeCollection,
      status: statusFor(currentPct, TARGETS.feeCollection),
      insight: gapAmount > 0 ? `₹${gapAmount.toLocaleString('en-IN')} gap to target` : 'On track',
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
}
