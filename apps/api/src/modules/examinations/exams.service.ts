import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamResult } from './entities/exam-result.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { EnterMarksDto } from './dto/enter-marks.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { assertTeacherClassSubjectAccess } from '../../common/utils/teacher-class-scope.util';

export interface ExamQuery {
  schoolClassId?: string;
  subjectId?: string;
}

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamResult) private readonly resultRepo: Repository<ExamResult>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<Exam> {
    return scopedRepo(this.examRepo, Exam);
  }
  private resultsRepo(): Repository<ExamResult> {
    return scopedRepo(this.resultRepo, ExamResult);
  }

  /**
   * Class-AND-subject-scoped: previously only checked the teacher was
   * assigned to the CLASS (assertTeacherClassAccess), which let a teacher
   * covering one subject in a class create an exam tagged with a
   * different subject in that same class — identical gap to the one the
   * LMS class-scoping sweep found and fixed. Now uses the subject-aware
   * assertTeacherClassSubjectAccess instead.
   */
  async create(dto: CreateExamDto, createdBy: string): Promise<Exam> {
    await assertTeacherClassSubjectAccess(
      this.timetableService,
      dto.tenant_id,
      createdBy,
      dto.school_class_id,
      dto.subject_id,
    );
    return this.repo().save(this.repo().create({ ...dto, created_by: createdBy }));
  }

  /**
   * teacherId is passed unconditionally for every caller (Admin included) —
   * the scoping decision is data-driven, not role-based. Class-AND-subject-
   * scoped: previously filtered to classIds alone (findClassIdsForTeacher),
   * now filters to actual class+subject PAIRS (findClassSubjectPairsForTeacher)
   * via the same Brackets OR-group pattern used in AssignmentsService — a
   * teacher covering Math in a class no longer sees that class's Science
   * exams in their list either.
   */
  async findAllForTenant(tenantId: string, query: ExamQuery, teacherId?: string): Promise<Exam[]> {
    const qb = this.repo().createQueryBuilder('exam').where('exam.tenant_id = :tenantId', { tenantId });
    if (query.schoolClassId) qb.andWhere('exam.school_class_id = :schoolClassId', { schoolClassId: query.schoolClassId });
    if (query.subjectId) qb.andWhere('exam.subject_id = :subjectId', { subjectId: query.subjectId });

    if (teacherId) {
      const pairs = await this.timetableService.findClassSubjectPairsForTeacher(tenantId, teacherId);
      if (pairs.length > 0) {
        qb.andWhere(
          new Brackets((sub) => {
            pairs.forEach((pair, index) => {
              const clause = `(exam.school_class_id = :classId${index} AND exam.subject_id = :subjectId${index})`;
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

    return qb.orderBy('exam.exam_date', 'DESC').getMany();
  }

  /**
   * requestingTeacherId is optional and additive: internal callers within
   * this service (enterMarks, findResultsForExam below) pass it to get the
   * ownership check for free, while anything that doesn't have a
   * meaningful "requesting teacher" (none currently) can omit it and get
   * the old unchecked behavior. Controller routes always pass user.userId,
   * same as the list endpoint. Class-AND-subject-scoped now — see create()
   * above for why.
   */
  async findOne(id: string, requestingTeacherId?: string): Promise<Exam> {
    const exam = await this.repo().findOne({ where: { id } });
    if (!exam) throw new NotFoundException(`Exam ${id} not found`);
    if (requestingTeacherId) {
      await assertTeacherClassSubjectAccess(
        this.timetableService,
        exam.tenant_id,
        requestingTeacherId,
        exam.school_class_id,
        exam.subject_id,
      );
    }
    return exam;
  }

  /**
   * Bulk-upserts marks for a whole class roster at once — same pattern as
   * Attendance's markAttendance. Validates that no entry exceeds the exam's
   * max_marks; a typo (e.g. 450 instead of 45) would otherwise silently
   * corrupt every downstream percentage/grade/report-card calculation for
   * that student.
   *
   * Routes through findOne(dto.exam_id, enteredBy) rather than a bare
   * lookup — this is what gives enterMarks the same class-AND-subject
   * ownership check as everything else, with no duplicated logic: a
   * Teacher can only enter marks for an exam belonging to a class+subject
   * combination they're actually assigned to teach.
   */
  async enterMarks(dto: EnterMarksDto, enteredBy: string): Promise<ExamResult[]> {
    const exam = await this.findOne(dto.exam_id, enteredBy);
    const maxMarks = parseFloat(exam.max_marks);

    for (const entry of dto.entries) {
      if (entry.marks_obtained !== undefined) {
        const marks = parseFloat(entry.marks_obtained);
        if (marks > maxMarks) {
          throw new BadRequestException(
            `Marks obtained (${marks}) cannot exceed this exam's max marks (${maxMarks}).`,
          );
        }
        if (marks < 0) {
          throw new BadRequestException('Marks obtained cannot be negative.');
        }
      }
    }

    const results: ExamResult[] = [];
    for (const entry of dto.entries) {
      let result = await this.resultsRepo().findOne({
        where: { tenant_id: exam.tenant_id, exam_id: dto.exam_id, student_id: entry.student_id },
      });
      if (result) {
        result.marks_obtained = entry.marks_obtained;
        result.entered_by = enteredBy;
      } else {
        result = this.resultsRepo().create({
          tenant_id: exam.tenant_id,
          exam_id: dto.exam_id,
          student_id: entry.student_id,
          marks_obtained: entry.marks_obtained,
          entered_by: enteredBy,
        });
      }
      results.push(await this.resultsRepo().save(result));
    }
    return results;
  }

  async findResultsForExam(examId: string, requestingTeacherId?: string): Promise<ExamResult[]> {
    if (requestingTeacherId) {
      await this.findOne(examId, requestingTeacherId); // throws if not this teacher's class+subject
    }
    return this.resultsRepo().find({ where: { exam_id: examId } });
  }

  findResultsForStudent(
    studentId: string,
    academicYearId?: string,
    examName?: string,
  ): Promise<Array<ExamResult & { exam: Exam }>> {
    const qb = this.resultsRepo()
      .createQueryBuilder('result')
      .innerJoinAndMapOne('result.exam', Exam, 'exam', 'exam.id = result.exam_id')
      .where('result.student_id = :studentId', { studentId });
    if (academicYearId) qb.andWhere('exam.academic_year_id = :academicYearId', { academicYearId });
    if (examName) qb.andWhere('exam.name = :examName', { examName });
    return qb.orderBy('exam.exam_date', 'ASC').getMany() as Promise<Array<ExamResult & { exam: Exam }>>;
  }
}