import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentElectiveSelection } from './entities/student-elective-selection.entity';
import { SelectElectiveDto } from './dto/select-elective.dto';
import { AdminSetElectiveSelectionDto } from './dto/admin-set-elective-selection.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from './students.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ClassElectiveOfferingsService } from '../classes/class-elective-offerings.service';
import { AcademicYearsService } from '../academic-years/academic-years.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class StudentElectiveSelectionsService {
  constructor(
    @InjectRepository(StudentElectiveSelection)
    private readonly selectionRepo: Repository<StudentElectiveSelection>,
    private readonly studentsService: StudentsService,
    private readonly subjectsService: SubjectsService,
    private readonly offeringsService: ClassElectiveOfferingsService,
    private readonly academicYearsService: AcademicYearsService,
  ) {}

  private repo(): Repository<StudentElectiveSelection> {
    return scopedRepo(this.selectionRepo, StudentElectiveSelection);
  }

  /**
   * Shared validation for both the self-service and admin-override paths:
   * subject must be a real elective AND actually offered for this specific
   * class (not just is_elective=true tenant-wide — see
   * ClassElectiveOfferingsService's own doc comment on why that
   * distinction matters).
   */
  private async assertSubjectOfferedForClass(schoolClassId: string, subjectId: string): Promise<string> {
    const subject = await this.subjectsService.findOne(subjectId);
    if (!subject.is_elective || !subject.elective_group) {
      throw new ConflictException(`Subject '${subject.name}' is not a valid elective option`);
    }
    const offerings = await this.offeringsService.findForClass(schoolClassId);
    const offered = offerings.some((o) => o.subject_id === subjectId);
    if (!offered) {
      throw new ConflictException(`Subject '${subject.name}' is not offered for this class`);
    }
    return subject.elective_group;
  }

  /**
   * Self-service — locked in once selected (session 27 decision): a
   * second attempt to select within the SAME elective_group+year is
   * rejected, not silently replaced. Only adminSet() below can override.
   * Current academic year is resolved server-side, never trusted from
   * the client, per the same session decision.
   */
  async selectMine(user: AuthenticatedUser, dto: SelectElectiveDto): Promise<StudentElectiveSelection> {
    if (!user.studentId) {
      throw new ForbiddenException('This endpoint is only available to Student accounts.');
    }
    const student = await this.studentsService.findOne(user.studentId);
    if (!student.school_class_id) {
      throw new ConflictException('You are not yet assigned to a class — contact your Admin.');
    }
    const currentYear = await this.academicYearsService.findCurrentForTenant(user.tenantId);
    const electiveGroup = await this.assertSubjectOfferedForClass(student.school_class_id, dto.subject_id);

    // Checked across ALL years, not just the current one — a choice made
    // in any prior year (e.g. before a grade promotion) still locks the
    // group in permanently. See findExistingInGroup's doc comment.
    const existingInGroup = await this.findExistingInGroup(user.tenantId, student.id, electiveGroup);
    if (existingInGroup) {
      throw new ForbiddenException(
        `You have already selected an elective for '${electiveGroup}' — contact your Admin to change it.`,
      );
    }

    return this.repo().save(
      this.repo().create({
        tenant_id: user.tenantId,
        student_id: student.id,
        subject_id: dto.subject_id,
        academic_year_id: currentYear.id,
      }),
    );
  }

  /** Self-service — the caller's own selections, most recent first. */
  async findMine(user: AuthenticatedUser): Promise<StudentElectiveSelection[]> {
    if (!user.studentId) return [];
    return this.repo().find({ where: { student_id: user.studentId }, order: { created_at: 'DESC' } });
  }

  /**
   * Admin roster view — every PERSISTENT selection for a class's students.
   * No longer filtered by academic_year_id: a selection is a permanent,
   * once-made choice (see the entity's own doc comment), so a student who
   * chose in an earlier year still shows their selection here regardless
   * of which year is "current" now. academic_year_id on each row remains
   * as a historical record of when the choice was made, not a lookup key.
   */
  async findForClass(tenantId: string, schoolClassId: string): Promise<StudentElectiveSelection[]> {
    const students = await this.studentsService.findAllForTenant(tenantId, { schoolClassId });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    return this.repo()
      .createQueryBuilder('sel')
      .where('sel.tenant_id = :tenantId', { tenantId })
      .andWhere('sel.student_id IN (:...studentIds)', { studentIds })
      .getMany();
  }

  /**
   * Admin override — bypasses the self-service lock-in entirely (removes
   * any existing selection in the same elective_group+year first, then
   * creates the new one) per session 27 decision: "only an Admin can
   * change it after that."
   */
  async adminSet(dto: AdminSetElectiveSelectionDto): Promise<StudentElectiveSelection> {
    const student = await this.studentsService.findOne(dto.student_id);
    if (!student.school_class_id) {
      throw new ConflictException('This student is not yet assigned to a class.');
    }
    const year = dto.academic_year_id
      ? { id: dto.academic_year_id }
      : await this.academicYearsService.findCurrentForTenant(dto.tenant_id);
    const electiveGroup = await this.assertSubjectOfferedForClass(student.school_class_id, dto.subject_id);

    // Overrides the PERSISTENT choice, wherever/whenever it was originally
    // made — not just one made in the current year. See
    // findExistingInGroup's doc comment.
    const existingInGroup = await this.findExistingInGroup(dto.tenant_id, student.id, electiveGroup);
    if (existingInGroup) {
      await this.repo().remove(existingInGroup);
    }

    return this.repo().save(
      this.repo().create({
        tenant_id: dto.tenant_id,
        student_id: student.id,
        subject_id: dto.subject_id,
        academic_year_id: year.id,
      }),
    );
  }

  /**
   * Checks across the student's ENTIRE selection history, not scoped to
   * any one academic_year_id — a real fix for a real gap: the previous
   * per-year scoping meant a student promoted to a new grade could select
   * a DIFFERENT language in the new year, silently creating a second row
   * in the same elective_group rather than being blocked. A selection is
   * now a genuinely permanent, once-made choice for a student's whole time
   * at the school, matching the actual intent (elective GROUPS like
   * "Language" are meant to be a single standing choice, not something
   * re-picked every year) rather than the original per-year design.
   *
   * No student-promotion event exists anywhere in the codebase to hook a
   * carry-forward action into (confirmed via a repo-wide search for
   * "promot*" before writing this) — so the fix lives entirely in this
   * lookup, which naturally works across a promotion with zero extra code,
   * rather than needing something to run AT promotion time.
   */
  private async findExistingInGroup(
    tenantId: string,
    studentId: string,
    electiveGroup: string,
  ): Promise<StudentElectiveSelection | null> {
    const selections = await this.repo().find({ where: { tenant_id: tenantId, student_id: studentId } });
    for (const sel of selections) {
      const subject = await this.subjectsService.findOne(sel.subject_id);
      if (subject.elective_group === electiveGroup) return sel;
    }
    return null;
  }
}