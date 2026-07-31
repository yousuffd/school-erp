import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamGroup } from './entities/exam-group.entity';
import { Exam } from './entities/exam.entity';
import { ExamResult } from './entities/exam-result.entity';
import { CreateExamGroupDto, UpdateExamGroupDto } from './dto/exam-group.dto';
import { scopedRepo } from '../../common/context/tenant-context';

/**
 * tenant_id is still an explicit field set on every insert (matching
 * ExamsService's convention — see CreateExamGroupDto for why), but every
 * repository call now goes through scopedRepo() so writes/reads happen on
 * the same request-scoped transaction/manager as the rest of the request
 * (see TenantRlsInterceptor) — matching ExamsService exactly, rather than
 * using the raw DI repository directly as the original draft did.
 */
@Injectable()
export class ExamGroupsService {
  constructor(
    @InjectRepository(ExamGroup) private readonly examGroupRepo: Repository<ExamGroup>,
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamResult) private readonly resultRepo: Repository<ExamResult>,
  ) {}

  private groupsRepo(): Repository<ExamGroup> {
    return scopedRepo(this.examGroupRepo, ExamGroup);
  }
  private examsRepo(): Repository<Exam> {
    return scopedRepo(this.examRepo, Exam);
  }
  private resultsRepo(): Repository<ExamResult> {
    return scopedRepo(this.resultRepo, ExamResult);
  }

  async findAll(tenantId: string): Promise<any[]> {
    const groups = await this.groupsRepo().find({
      where: { tenant_id: tenantId },
      relations: ['exams'],
      order: { created_at: 'DESC' },
    });
    return groups.map((g) => ({
      ...g,
      examCount: g.exams?.length ?? 0,
      subjectCount: new Set((g.exams ?? []).map((e) => e.subject_id)).size,
      classCount: new Set((g.exams ?? []).map((e) => e.school_class_id)).size,
    }));
  }

  // NOTE: matches ExamsService.findOne()'s existing convention of not
  // filtering by tenant on a single-record lookup by id. Flagging rather
  // than silently fixing here — if this gets tightened, it should happen
  // consistently across both single-exam and exam-group lookups in one
  // pass, not diverge between them.
  async findOne(id: string): Promise<ExamGroup> {
    const group = await this.groupsRepo().findOne({
      where: { id },
      relations: ['exams'],
    });
    if (!group) throw new NotFoundException('Exam group not found');
    return group;
  }

  /**
   * Creates one Exam row per (subject × class) combination.
   * - Applies each subject's default date/max_marks.
   * - Any cell present in `overrides` wins over the subject default.
   * - Skips (subject, class) pairs that already have an exam for this
   *   academic year — reported back rather than thrown, so the rest of
   *   the batch still succeeds.
   */
  async bulkCreate(dto: CreateExamGroupDto, createdBy: string) {
    const group = await this.groupsRepo().save(
      this.groupsRepo().create({
        tenant_id: dto.tenant_id,
        academic_year_id: dto.academic_year_id,
        name: dto.name,
      }),
    );

    const overrideMap = new Map<string, { date?: string; max_marks?: number }>();
    for (const o of dto.overrides ?? []) {
      overrideMap.set(`${o.subject_id}:${o.school_class_id}`, {
        date: o.date,
        max_marks: o.max_marks,
      });
    }

    const created: Exam[] = [];
    const skipped: { subject_id: string; school_class_id: string; reason: string }[] = [];

    for (const subject of dto.subjects) {
      for (const school_class_id of dto.school_class_ids) {
        const key = `${subject.subject_id}:${school_class_id}`;
        // tenant_id added here — the original draft's duplicate-check could
        // false-positive-skip against another tenant's exam for the same
        // subject/class/year combination.
        const existing = await this.examsRepo().findOne({
          where: {
            tenant_id: dto.tenant_id,
            subject_id: subject.subject_id,
            school_class_id,
            academic_year_id: dto.academic_year_id,
          },
        });
        if (existing) {
          skipped.push({
            subject_id: subject.subject_id,
            school_class_id,
            reason: 'An exam for this subject and class already exists this academic year',
          });
          continue;
        }

        const override = overrideMap.get(key);
        const exam = this.examsRepo().create({
          tenant_id: dto.tenant_id,
          subject_id: subject.subject_id,
          school_class_id,
          academic_year_id: dto.academic_year_id,
          name: dto.name,
          exam_date: override?.date ?? subject.default_date,
          max_marks: String(override?.max_marks ?? subject.default_max_marks),
          created_by: createdBy,
          exam_group_id: group.id,
        });
        created.push(await this.examsRepo().save(exam));
      }
    }

    if (created.length === 0) {
      // Nothing was actually scheduled — don't leave an empty group behind.
      await this.groupsRepo().delete(group.id);
      throw new BadRequestException(
        'Every subject/class combination already has an exam this academic year — nothing new was created.',
      );
    }

    return { group, created, skipped };
  }

  /**
   * Cascades a name/date/max_marks change to every child exam that does not
   * yet have marks entered. Exams with marks are left untouched and
   * reported back as skipped.
   */
  async update(id: string, dto: UpdateExamGroupDto) {
    const group = await this.findOne(id);

    if (dto.name) {
      group.name = dto.name;
      await this.groupsRepo().save(group);
    }

    const skipped: { exam_id: string; school_class_id: string; reason: string }[] = [];
    const updated: Exam[] = [];

    if (dto.cascade_date || dto.cascade_max_marks) {
      for (const exam of group.exams ?? []) {
        const hasMarks = await this.examHasMarks(exam.id);
        if (hasMarks) {
          skipped.push({
            exam_id: exam.id,
            school_class_id: exam.school_class_id,
            reason: 'Marks already entered for this section — left unchanged',
          });
          continue;
        }
        if (dto.cascade_date) exam.exam_date = dto.cascade_date;
        if (dto.cascade_max_marks) exam.max_marks = String(dto.cascade_max_marks);
        updated.push(await this.examsRepo().save(exam));
      }
    }

    return { group, updated, skipped };
  }

  /**
   * Deletes the whole group only if NO child exam has marks entered.
   * If any do, the delete is refused outright — protecting real data is
   * more important than a clean UI action here.
   */
  async remove(id: string) {
    const group = await this.findOne(id);
    const examsWithMarks: string[] = [];

    for (const exam of group.exams ?? []) {
      if (await this.examHasMarks(exam.id)) {
        examsWithMarks.push(exam.school_class_id);
      }
    }

    if (examsWithMarks.length > 0) {
      throw new BadRequestException(
        `Cannot delete — ${examsWithMarks.length} section(s) in this group already have marks entered. ` +
          `Remove marks first, or delete individual exams without marks one at a time.`,
      );
    }

    await this.examsRepo().delete({ exam_group_id: id });
    await this.groupsRepo().delete(id);
    return { deleted: true };
  }

  /**
   * A section "has marks" if at least one ExamResult row for that exam
   * carries a non-null marks_obtained — matching how enterMarks() in
   * ExamsService upserts one ExamResult row per (exam, student) pair
   * regardless of whether marks were actually filled in (e.g. an "Absent"
   * checkbox still creates a row with marks_obtained left unset). Counting
   * rows alone would treat "roster loaded but nothing entered yet" as
   * already having marks; this checks for an actual recorded value.
   */
  private async examHasMarks(examId: string): Promise<boolean> {
    const count = await this.resultsRepo()
      .createQueryBuilder('result')
      .where('result.exam_id = :examId', { examId })
      .andWhere('result.marks_obtained IS NOT NULL')
      .getCount();
    return count > 0;
  }
}