import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimetableSlot, DayOfWeek } from './entities/timetable-slot.entity';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { TimetableRequirementDto } from './dto/generate-timetable.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { ClassElectiveOffering } from '../classes/entities/class-elective-offering.entity';
import { TeacherSubjectSpecialization } from '../subjects/entities/teacher-subject-specialization.entity';
import { SchoolClass } from '../classes/entities/school-class.entity';

const DEFAULT_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];
const DEFAULT_PERIODS_PER_DAY = 8;

export interface UnscheduledRequirement {
  requirement: TimetableRequirementDto;
  periods_placed: number;
  periods_requested: number;
}

export interface GenerateScheduleResult {
  created: TimetableSlot[];
  unscheduled: UnscheduledRequirement[];
}

function slotKey(day: DayOfWeek, period: number): string {
  return `${day}-${period}`;
}

function markOccupied(map: Map<string, Set<string>>, id: string, key: string): void {
  if (!map.has(id)) map.set(id, new Set());
  map.get(id)!.add(key);
}

function isOccupied(map: Map<string, Set<string>>, id: string, key: string): boolean {
  return map.get(id)?.has(key) ?? false;
}

/** Rotates an array so different requirements/days don't all reach for the same starting point first — deterministic given a fixed n, used together with shuffle() below for round-robin fairness across a randomized base order. */
function rotate<T>(arr: T[], n: number): T[] {
  const offset = n % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
}

/**
 * Fisher-Yates shuffle — returns a new array, does not mutate the input.
 * Used once per generateSchedule() call to pick a fresh random base order
 * for days and periods, so two runs with identical input produce different
 * (but each individually well-distributed, via rotate()) layouts. This is
 * the "randomize" half of the scheduler; rotate() is the "round-robin" half
 * — together they avoid both (a) always picking the same slot deterministically
 * run after run, and (b) clustering every requirement/day onto the same
 * period, which is what a purely fixed 1..N period search order caused.
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(TimetableSlot) private readonly slotRepo: Repository<TimetableSlot>,
    @InjectRepository(ClassElectiveOffering) private readonly offeringRepo: Repository<ClassElectiveOffering>,
    @InjectRepository(TeacherSubjectSpecialization) private readonly specializationRepo: Repository<TeacherSubjectSpecialization>,
    @InjectRepository(SchoolClass) private readonly schoolClassRepo: Repository<SchoolClass>,
  ) {}

  private repo(): Repository<TimetableSlot> {
    return scopedRepo(this.slotRepo, TimetableSlot);
  }
  private offeringsRepo(): Repository<ClassElectiveOffering> {
    return scopedRepo(this.offeringRepo, ClassElectiveOffering);
  }
  private specializationsRepo(): Repository<TeacherSubjectSpecialization> {
    return scopedRepo(this.specializationRepo, TeacherSubjectSpecialization);
  }
  private schoolClassesRepo(): Repository<SchoolClass> {
    return scopedRepo(this.schoolClassRepo, SchoolClass);
  }

  async create(dto: CreateTimetableSlotDto): Promise<TimetableSlot> {
    // The unique index on (tenant, class, day, period) already stops double-
    // booking the same CLASS's period slot. This second check covers the
    // other half of the real-world conflict: a teacher can't be in two
    // classes during the same period, which isn't something a DB unique
    // constraint on this table alone can express (it'd need to span rows
    // for potentially different classes).
    const teacherConflict = await this.repo().findOne({
      where: {
        tenant_id: dto.tenant_id,
        teacher_id: dto.teacher_id,
        day_of_week: dto.day_of_week,
        period_number: dto.period_number,
      },
    });
    if (teacherConflict) {
      throw new ConflictException(
        `This teacher is already scheduled for another class on ${dto.day_of_week}, period ${dto.period_number}.`,
      );
    }

    return this.repo().save(this.repo().create(dto));
  }

  findForClass(schoolClassId: string): Promise<TimetableSlot[]> {
    return this.repo().find({
      where: { school_class_id: schoolClassId },
      order: { day_of_week: 'ASC', period_number: 'ASC' },
    });
  }

  findForTeacher(tenantId: string, teacherId: string): Promise<TimetableSlot[]> {
    return this.repo().find({
      where: { tenant_id: tenantId, teacher_id: teacherId },
      order: { day_of_week: 'ASC', period_number: 'ASC' },
    });
  }

  /**
   * Distinct class IDs this teacher currently teaches, per the timetable —
   * the data-driven signal other modules (starting with Examinations) scope
   * Teacher-facing views by, instead of hardcoding role names. An empty
   * array means "not currently assigned to any class in the timetable";
   * callers decide what that means for them.
   */
  async findClassIdsForTeacher(tenantId: string, teacherId: string): Promise<string[]> {
    const rows = await this.repo()
      .createQueryBuilder('slot')
      .select('DISTINCT slot.school_class_id', 'school_class_id')
      .where('slot.tenant_id = :tenantId', { tenantId })
      .andWhere('slot.teacher_id = :teacherId', { teacherId })
      .getRawMany<{ school_class_id: string }>();
    return rows.map((r) => r.school_class_id);
  }

  /**
   * Class+subject PAIRS this teacher currently teaches — for list-shape
   * routes (no single target to check, e.g. AssignmentsService.
   * findAllForTenant) that need to filter a whole query by "only rows
   * matching one of this teacher's actual class+subject combinations,"
   * not just "in a class this teacher happens to be in at all." Mirrors
   * findClassIdsForTeacher's shape/semantics but keeps subject_id attached
   * per row instead of collapsing to distinct class IDs alone. Empty array
   * means the same "not currently assigned to any timetable slot" case —
   * callers apply the same unscoped-fallback decision as findClassIdsForTeacher.
   */
  async findClassSubjectPairsForTeacher(
    tenantId: string,
    teacherId: string,
  ): Promise<{ school_class_id: string; subject_id: string }[]> {
    return this.repo()
      .createQueryBuilder('slot')
      .select('slot.school_class_id', 'school_class_id')
      .addSelect('slot.subject_id', 'subject_id')
      .distinct(true)
      .where('slot.tenant_id = :tenantId', { tenantId })
      .andWhere('slot.teacher_id = :teacherId', { teacherId })
      .getRawMany<{ school_class_id: string; subject_id: string }>();
  }

  async findTeachersBySubject(
    tenantId: string,
  ): Promise<{ subject_id: string; teacher_id: string }[]> {
    return this.repo()
      .createQueryBuilder('slot')
      .select('slot.subject_id', 'subject_id')
      .addSelect('slot.teacher_id', 'teacher_id')
      .distinct(true)
      .where('slot.tenant_id = :tenantId', { tenantId })
      .getRawMany<{ subject_id: string; teacher_id: string }>();
  }

  async findTeacherOccupancy(
    tenantId: string,
  ): Promise<{ teacher_id: string; day_of_week: DayOfWeek; period_number: number }[]> {
    return this.repo()
      .createQueryBuilder('slot')
      .select('slot.teacher_id', 'teacher_id')
      .addSelect('slot.day_of_week', 'day_of_week')
      .addSelect('slot.period_number', 'period_number')
      .where('slot.tenant_id = :tenantId', { tenantId })
      .getRawMany<{ teacher_id: string; day_of_week: DayOfWeek; period_number: number }>();
  }
  async hasTeacherClassSubjectAssignment(
    tenantId: string,
    teacherId: string,
    schoolClassId: string,
    subjectId: string,
  ): Promise<boolean> {
    const count = await this.repo().count({
      where: {
        tenant_id: tenantId,
        teacher_id: teacherId,
        school_class_id: schoolClassId,
        subject_id: subjectId,
      },
    });
    return count > 0;
  }

  /**
   * AI Timetable Optimizer beta (Phase 2, blueprint Part 2 §26) —
   * algorithmic, not LLM-based: a deterministic-per-call-seed greedy
   * scheduler, not a Claude API call. Constraint-satisfaction problems like
   * "place N periods without double-booking a class or a teacher" are a poor
   * fit for an LLM anyway; a constraint solver gives an exact, explainable
   * answer, which matters more here than natural-language flexibility.
   *
   * Treats every EXISTING TimetableSlot row for the tenant as fixed — this
   * only fills gaps, never overwrites or removes anything already scheduled
   * (explicit product decision, not a limitation to fix later).
   *
   * Two-pass placement per requirement: pass 1 spreads periods across
   * distinct days (basic workload balancing — don't stack a subject's whole
   * week on one day); pass 2 allows doubling up on a day only if pass 1
   * couldn't place everything (e.g. periods_per_week > available days).
   * Requirements are processed largest-periods_per_week-first — placing the
   * tightest constraints first is a standard bin-packing heuristic that
   * improves the odds of a full solve.
   *
   * Randomization + round-robin (session 27, replacing a version that always
   * searched periods in fixed 1..N order): a fresh random base order for
   * BOTH days and periods is chosen once per call via shuffle(), then
   * rotate() shifts that base order per-requirement AND per-day-within-a-
   * requirement, so the search doesn't cluster on the same period across
   * consecutive days (the exact bug a static 1..N loop produced — every
   * requirement always found period 1 free first and kept picking it).
   * Two calls with identical input now produce different (still valid,
   * still evenly-distributed) layouts; the SAME call still won't stack a
   * requirement onto one period across all its days.
   *
   * Never silently drops anything it couldn't place — returns exactly what
   * it scheduled and what's still short, so an Admin sees a partial result
   * honestly rather than a false "success."
   */
  async generateSchedule(
    tenantId: string,
    requirements: TimetableRequirementDto[],
    days: DayOfWeek[] = DEFAULT_DAYS,
    periodsPerDay: number = DEFAULT_PERIODS_PER_DAY,
  ): Promise<GenerateScheduleResult> {
    const existing = await this.repo().find({ where: { tenant_id: tenantId } });

    const classOccupancy = new Map<string, Set<string>>();
    const teacherOccupancy = new Map<string, Set<string>>();
    for (const slot of existing) {
      markOccupied(classOccupancy, slot.school_class_id, slotKey(slot.day_of_week, slot.period_number));
      markOccupied(teacherOccupancy, slot.teacher_id, slotKey(slot.day_of_week, slot.period_number));
    }

    // Fresh random base order per call — the "randomize" half.
    const baseDays = shuffle(days);
    const basePeriods = shuffle(Array.from({ length: periodsPerDay }, (_, i) => i + 1));

    const orderedRequirements = [...requirements].sort((a, b) => b.periods_per_week - a.periods_per_week);

    const toCreate: Partial<TimetableSlot>[] = [];
    const unscheduled: UnscheduledRequirement[] = [];

    orderedRequirements.forEach((req, reqIndex) => {
      // Round-robin across requirements — the "round-robin" half, part 1.
      const dayOrder = rotate(baseDays, reqIndex);
      let placed = 0;

      // periodsForAttempt varies by BOTH which requirement this is and how
      // many days into this requirement we are — round-robin, part 2. This
      // is what actually fixes the clustering: without varying by dayAttempt
      // too, a requirement would still always search the same period first
      // on every day it tries, just a different (still-fixed) period than
      // requirement #1 chose.
      const periodsForAttempt = (dayAttempt: number): number[] => rotate(basePeriods, reqIndex + dayAttempt);

      const tryPlaceOnDay = (day: DayOfWeek, periodsToTry: number[]): boolean => {
        for (const period of periodsToTry) {
          const key = slotKey(day, period);
          if (isOccupied(classOccupancy, req.school_class_id, key)) continue;
          if (isOccupied(teacherOccupancy, req.teacher_id, key)) continue;
          markOccupied(classOccupancy, req.school_class_id, key);
          markOccupied(teacherOccupancy, req.teacher_id, key);
          toCreate.push({
            tenant_id: tenantId,
            school_class_id: req.school_class_id,
            subject_id: req.subject_id,
            teacher_id: req.teacher_id,
            day_of_week: day,
            period_number: period,
          });
          return true;
        }
        return false;
      };

      // Pass 1 — one period per day, spread across distinct days.
      for (let dayAttempt = 0; dayAttempt < dayOrder.length; dayAttempt++) {
        if (placed >= req.periods_per_week) break;
        if (tryPlaceOnDay(dayOrder[dayAttempt], periodsForAttempt(dayAttempt))) placed += 1;
      }

      // Pass 2 — only if pass 1 couldn't fit everything: allow multiple
      // periods on the same day.
      if (placed < req.periods_per_week) {
        for (let dayAttempt = 0; dayAttempt < dayOrder.length; dayAttempt++) {
          const periodsToTry = periodsForAttempt(dayAttempt);
          while (placed < req.periods_per_week && tryPlaceOnDay(dayOrder[dayAttempt], periodsToTry)) {
            placed += 1;
          }
          if (placed >= req.periods_per_week) break;
        }
      }

      if (placed < req.periods_per_week) {
        unscheduled.push({ requirement: req, periods_placed: placed, periods_requested: req.periods_per_week });
      }
    });

    const created = toCreate.length > 0 ? await this.repo().save(this.repo().create(toCreate)) : [];
    return { created, unscheduled };
  }

  async remove(id: string): Promise<void> {
    const slot = await this.repo().findOne({ where: { id } });
    if (!slot) throw new NotFoundException(`Timetable slot ${id} not found`);
    await this.repo().remove(slot);
  }

  /**
   * Real, reusable, tenant-agnostic version of the manual elective-period
   * placement originally done via a one-off script for Greenwood — same
   * algorithm, generalized so it behaves identically for every tenant
   * (only the underlying data differs). Deletes each in-scope class's
   * EXISTING elective-subject slots first (a clean re-run, matching the
   * script's own "wipe old scattered periods, then place fresh" approach),
   * then for every class with elective offerings: computes the class's own
   * genuinely free day/periods (excluding its remaining non-elective
   * slots), intersects that with every offered elective's specialized
   * teacher being simultaneously free — tracked and updated incrementally
   * across classes in this same run, so the same French teacher is never
   * double-booked between two different classes — and places up to
   * TARGET_PERIODS_PER_WEEK (3) shared, co-located periods per class,
   * honestly reporting a shortfall (as Grade 5-A got 2/3 for Greenwood)
   * rather than forcing a conflict.
   */
  async generateElectivePeriods(tenantId: string): Promise<{
    created: TimetableSlot[];
    perClass: { school_class_id: string; periods_placed: number; periods_requested: number }[];
  }> {
    const TARGET_PERIODS_PER_WEEK = 3;
    const DAYS_ORDER = DEFAULT_DAYS;
    const PERIODS_ORDER = Array.from({ length: DEFAULT_PERIODS_PER_DAY }, (_, i) => i + 1);

    const allOfferings = await this.offeringsRepo().find({ where: { tenant_id: tenantId } });
    const classIds = [...new Set(allOfferings.map((o) => o.school_class_id))];
    if (classIds.length === 0) {
      return { created: [], perClass: [] };
    }

    const offeringsByClass = new Map<string, string[]>();
    allOfferings.forEach((o) => {
      if (!offeringsByClass.has(o.school_class_id)) offeringsByClass.set(o.school_class_id, []);
      offeringsByClass.get(o.school_class_id)!.push(o.subject_id);
    });

    const allElectiveSubjectIds = [...new Set(allOfferings.map((o) => o.subject_id))];
    const specializations = await this.specializationsRepo().find({
      where: { tenant_id: tenantId },
    });
    const teacherIdBySubjectId = new Map<string, string>();
    specializations.forEach((s) => {
      if (allElectiveSubjectIds.includes(s.subject_id)) teacherIdBySubjectId.set(s.subject_id, s.teacher_id);
    });

    // Wipe each in-scope class's EXISTING elective-subject slots first —
    // same "clean re-run" behavior as the original script, so this can be
    // safely re-run after offerings/specializations change without leaving
    // stale scattered periods behind.
    for (const classId of classIds) {
      const subjectIds = offeringsByClass.get(classId) ?? [];
      if (subjectIds.length === 0) continue;
      const existing = await this.repo().find({
        where: { tenant_id: tenantId, school_class_id: classId },
      });
      const toDelete = existing.filter((s) => subjectIds.includes(s.subject_id));
      if (toDelete.length > 0) await this.repo().remove(toDelete);
    }

    // Re-fetch each class's remaining (non-elective) slots AFTER the wipe,
    // to compute genuinely free day/periods per class.
    const classBusy = new Map<string, Set<string>>();
    for (const classId of classIds) {
      const remaining = await this.repo().find({ where: { tenant_id: tenantId, school_class_id: classId } });
      const busy = new Set<string>();
      remaining.forEach((s) => busy.add(slotKey(s.day_of_week, s.period_number)));
      classBusy.set(classId, busy);
    }

    // Tracks every elective teacher's commitments AS THEY'RE ASSIGNED in
    // this run — the key mechanism that prevents double-booking the same
    // teacher across two different classes' elective periods.
    const teacherBusy = new Map<string, Set<string>>();

    const placements = new Map<string, string[]>(); // classId -> chosen "day-period" keys

    for (const classId of classIds) {
      const subjectIds = offeringsByClass.get(classId) ?? [];
      const relevantTeacherIds = subjectIds
        .map((sid) => teacherIdBySubjectId.get(sid))
        .filter((t): t is string => Boolean(t));

      const chosen: string[] = [];
      for (const day of DAYS_ORDER) {
        for (const period of PERIODS_ORDER) {
          if (chosen.length >= TARGET_PERIODS_PER_WEEK) break;
          const key = slotKey(day, period);
          if (classBusy.get(classId)?.has(key)) continue;
          if (chosen.includes(key)) continue;
          const teacherConflict = relevantTeacherIds.some((tid) => teacherBusy.get(tid)?.has(key));
          if (teacherConflict) continue;
          chosen.push(key);
        }
        if (chosen.length >= TARGET_PERIODS_PER_WEEK) break;
      }

      placements.set(classId, chosen);
      chosen.forEach((key) => {
        relevantTeacherIds.forEach((tid) => {
          if (!teacherBusy.has(tid)) teacherBusy.set(tid, new Set());
          teacherBusy.get(tid)!.add(key);
        });
      });
    }

    const toCreate: Partial<TimetableSlot>[] = [];
    const perClass: { school_class_id: string; periods_placed: number; periods_requested: number }[] = [];

    for (const classId of classIds) {
      const subjectIds = offeringsByClass.get(classId) ?? [];
      const chosen = placements.get(classId) ?? [];
      chosen.forEach((key) => {
        const [day, periodStr] = key.split('-');
        const period = Number(periodStr);
        subjectIds.forEach((subjectId) => {
          const teacherId = teacherIdBySubjectId.get(subjectId);
          if (!teacherId) return; // no specialized teacher — can't place this subject, skipped silently (surfaced separately via the Subjects page's own warning)
          toCreate.push({
            tenant_id: tenantId,
            school_class_id: classId,
            subject_id: subjectId,
            teacher_id: teacherId,
            day_of_week: day as DayOfWeek,
            period_number: period,
          });
        });
      });
      perClass.push({
        school_class_id: classId,
        periods_placed: chosen.length,
        periods_requested: TARGET_PERIODS_PER_WEEK,
      });
    }

    const created = toCreate.length > 0 ? await this.repo().save(this.repo().create(toCreate)) : [];
    return { created, perClass };
  }
}