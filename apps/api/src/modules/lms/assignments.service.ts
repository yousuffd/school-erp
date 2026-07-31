import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { TimetableService } from '../timetable/timetable.service';
import { assertTeacherClassSubjectAccess } from '../../common/utils/teacher-class-scope.util';

export interface AssignmentQuery {
  schoolClassId?: string;
  subjectId?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment) private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission) private readonly submissionRepo: Repository<AssignmentSubmission>,
    private readonly studentsService: StudentsService,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<Assignment> {
    return scopedRepo(this.assignmentRepo, Assignment);
  }
  private submissionsRepo(): Repository<AssignmentSubmission> {
    return scopedRepo(this.submissionRepo, AssignmentSubmission);
  }

  /**
   * Class-AND-subject-scoped: a teacher may only create an assignment for
   * a class+subject combination they're actually timetabled to teach, not
   * just any class they happen to be assigned to (a teacher covering Math
   * in a class shouldn't be able to create a Science assignment there).
   */
  async create(dto: CreateAssignmentDto, createdBy: string): Promise<Assignment> {
    await assertTeacherClassSubjectAccess(
      this.timetableService,
      dto.tenant_id,
      createdBy,
      dto.school_class_id,
      dto.subject_id,
    );
    return this.repo().save(
      this.repo().create({
        tenant_id: dto.tenant_id,
        subject_id: dto.subject_id,
        school_class_id: dto.school_class_id,
        academic_year_id: dto.academic_year_id,
        title: dto.title,
        instructions: dto.instructions,
        due_date: new Date(dto.due_date),
        max_score: String(dto.max_score),
        created_by: createdBy,
      }),
    );
  }

  /**
   * teacherId is passed unconditionally for every caller (Admin included) —
   * same data-driven scoping as ExamsService.findAllForTenant. Unscoped if
   * teacherId has no timetable assignments at all.
   *
   * Class-AND-subject-scoped: filters to assignments whose (class, subject)
   * combination matches one of the teacher's actual timetable pairs, not
   * just assignments in a class the teacher happens to be in at all — a
   * teacher covering Math in a class shouldn't see that class's Science
   * assignments in their list either.
   */
  async findAllForTenant(tenantId: string, query: AssignmentQuery, teacherId?: string): Promise<Assignment[]> {
    const qb = this.repo().createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
    if (query.schoolClassId) qb.andWhere('a.school_class_id = :schoolClassId', { schoolClassId: query.schoolClassId });
    if (query.subjectId) qb.andWhere('a.subject_id = :subjectId', { subjectId: query.subjectId });

    if (teacherId) {
      const pairs = await this.timetableService.findClassSubjectPairsForTeacher(tenantId, teacherId);
      if (pairs.length > 0) {
        qb.andWhere(
          new Brackets((sub) => {
            pairs.forEach((pair, index) => {
              const clause = `(a.school_class_id = :classId${index} AND a.subject_id = :subjectId${index})`;
              const params = { [`classId${index}`]: pair.school_class_id, [`subjectId${index}`]: pair.subject_id };
              if (index === 0) {
                sub.where(clause, params);
              } else {
                sub.orWhere(clause, params);
              }
            });
          }),
        );
      }
    }

    return qb.orderBy('a.due_date', 'DESC').getMany();
  }

  /**
   * requestingTeacherId optional and additive — same pattern as
   * ExamsService.findOne. Class-AND-subject-scoped: a teacher may only
   * look up an assignment whose class+subject matches a timetable slot
   * they actually hold.
   */
  async findOne(id: string, requestingTeacherId?: string): Promise<Assignment> {
    const assignment = await this.repo().findOne({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    if (requestingTeacherId) {
      await assertTeacherClassSubjectAccess(
        this.timetableService,
        assignment.tenant_id,
        requestingTeacherId,
        assignment.school_class_id,
        assignment.subject_id,
      );
    }
    return assignment;
  }

  async findForStudent(tenantId: string, studentId: string): Promise<Assignment[]> {
    const student = await this.studentsService.findOne(studentId);
    if (!student.school_class_id) return [];
    return this.repo().find({
      where: { tenant_id: tenantId, school_class_id: student.school_class_id },
      order: { due_date: 'DESC' },
    });
  }

  /**
   * Routes through findOne(id, requestingTeacherId) rather than a bare
   * lookup — same reuse pattern as Exams' enterMarks — giving this the
   * same class-AND-subject-ownership check with no duplicated logic, on
   * top of the pre-existing submission-guard.
   */
  async remove(id: string, requestingTeacherId?: string): Promise<{ deleted: boolean }> {
    await this.findOne(id, requestingTeacherId); // throws if not this teacher's class+subject

    const count = await this.submissionsRepo().count({ where: { assignment_id: id } });
    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete — ${count} student submission(s) already exist for this assignment.`,
      );
    }
    await this.repo().delete(id);
    return { deleted: true };
  }
}