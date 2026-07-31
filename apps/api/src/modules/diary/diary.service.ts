import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DiaryEntry, DiaryEntryScope } from './entities/diary-entry.entity';
import { DiaryReply } from './entities/diary-reply.entity';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { CreateDiaryReplyDto } from './dto/create-diary-reply.dto';
import { QueryDiaryEntriesDto } from './dto/query-diary-entries.dto';

import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { assertTeacherClassAccess } from '../../common/utils/teacher-class-scope.util';
import { getScopedStudentIds } from '../../common/utils/teacher-student-scope.util';
import { Student } from '../students/entities/student.entity';
import { SchoolClass } from '../classes/entities/school-class.entity';

// VERIFY: roleName string comparisons below ('Teacher', 'Parent', 'Student')
// assume those are the exact values stored on the Role record's `name`
// column. If your seed data uses different casing/values (check
// roles/seed/ or SystemRoleName), fix the string literals here to match —
// don't guess a third time, just grep `roles/seed` before running this.

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(DiaryEntry) private readonly diaryEntryRepo: Repository<DiaryEntry>,
    @InjectRepository(DiaryReply) private readonly diaryReplyRepo: Repository<DiaryReply>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolClass) private readonly schoolClassRepo: Repository<SchoolClass>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<DiaryEntry> {
    return scopedRepo(this.diaryEntryRepo, DiaryEntry);
  }
  private replyRepo(): Repository<DiaryReply> {
    return scopedRepo(this.diaryReplyRepo, DiaryReply);
  }
  private studentsRepo(): Repository<Student> {
    return scopedRepo(this.studentRepo, Student);
  }
  private classesRepo(): Repository<SchoolClass> {
    return scopedRepo(this.schoolClassRepo, SchoolClass);
  }

  async create(dto: CreateDiaryEntryDto, user: AuthenticatedUser) {
    if (dto.scope === DiaryEntryScope.STUDENT && !dto.student_id) {
      throw new BadRequestException('student_id is required for a student-scope entry');
    }

    // Parent gets a dedicated, narrower path — deliberately NOT routed
    // through assertTeacherClassAccess/getScopedStudentIds below, since
    // both utilities treat "zero timetable assignments" as UNSCOPED (safe
    // for Admin, who also has zero timetable rows, but a Parent has zero
    // timetable rows too — reusing them as-is would let a Parent post an
    // entry for any class/student in the school). A Parent may only create
    // a student-scope entry for one of their own linked children, and
    // class_id is derived server-side from the student's real class,
    // never trusted from the client payload.
    if (user.roleName === 'Parent') {
      if (dto.scope !== DiaryEntryScope.STUDENT) {
        throw new ForbiddenException('Parents can only post an entry about their own child, not a class-wide entry.');
      }
      const linkedStudentIds = user.parentOfStudentIds ?? [];
      if (!dto.student_id || !linkedStudentIds.includes(dto.student_id)) {
        throw new ForbiddenException('You can only post diary entries for your own linked child.');
      }
      const student = await this.studentsRepo().findOne({ where: { id: dto.student_id } });
      if (!student || !student.school_class_id) {
        throw new NotFoundException('Student or student\'s class not found');
      }
      const schoolClass = await this.classesRepo().findOne({ where: { id: student.school_class_id } });
      if (!schoolClass) {
        throw new NotFoundException('Class not found');
      }
      const entry = this.repo().create({
        scope: DiaryEntryScope.STUDENT,
        student_id: dto.student_id,
        class_id: student.school_class_id,
        category: dto.category,
        content: dto.content,
        tenant_id: user.tenantId,
        campus_id: schoolClass.campus_id,
        author_id: user.userId,
        entry_date: dto.entry_date ?? new Date().toISOString().slice(0, 10),
      });
      return this.repo().save(entry);
    }

    if (!dto.class_id) {
      throw new BadRequestException('class_id is required.');
    }

    // Throws if the teacher isn't timetabled for this class; no-ops for an
    // unscoped caller (Admin) per the util's documented fallback.
    await assertTeacherClassAccess(this.timetableService, user.tenantId, user.userId, dto.class_id);

    if (dto.scope === DiaryEntryScope.STUDENT && dto.student_id) {
      const scopedIds = await getScopedStudentIds(
        this.timetableService,
        this.studentRepo,
        user.tenantId,
        user.userId,
      );
      if (scopedIds !== null && !scopedIds.includes(dto.student_id)) {
        throw new ForbiddenException('This student is outside your assigned classes.');
      }
    }

    const schoolClass = await this.classesRepo().findOne({ where: { id: dto.class_id } });
    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    const entry = this.repo().create({
      ...dto,
      tenant_id: user.tenantId,
      campus_id: schoolClass.campus_id,
      author_id: user.userId,
      entry_date: dto.entry_date ?? new Date().toISOString().slice(0, 10),
    });
    return this.repo().save(entry);
  }

  async findAll(query: QueryDiaryEntriesDto, user: AuthenticatedUser) {
    const qb = this.repo().createQueryBuilder('entry').where('entry.tenant_id = :tenantId', {
      tenantId: user.tenantId,
    });

    if (user.roleName === 'Teacher') {
      const classIds = await this.timetableService.findClassIdsForTeacher(user.tenantId, user.userId);
      if (classIds.length > 0) {
        qb.andWhere('entry.class_id IN (:...classIds)', { classIds });
      }
      // classIds.length === 0 => unscoped (no timetable assignments yet) — no filter added
    } else if (user.roleName === 'Parent') {
      const linkedStudentIds = user.parentOfStudentIds ?? [];
      const linkedClassIds = await this.getClassIdsForStudents(linkedStudentIds);
      qb.andWhere(
        '((entry.scope = :classScope AND entry.class_id IN (:...classIds)) OR (entry.scope = :studentScope AND entry.student_id IN (:...studentIds)))',
        {
          classScope: DiaryEntryScope.CLASS,
          studentScope: DiaryEntryScope.STUDENT,
          classIds: linkedClassIds.length ? linkedClassIds : ['00000000-0000-0000-0000-000000000000'],
          studentIds: linkedStudentIds.length ? linkedStudentIds : ['00000000-0000-0000-0000-000000000000'],
        },
      );
    } else if (user.roleName === 'Student') {
      const ownClassId = await this.getOwnClassId(user.studentId);
      qb.andWhere(
        '((entry.scope = :classScope AND entry.class_id = :ownClassId) OR (entry.scope = :studentScope AND entry.student_id = :ownStudentId))',
        {
          classScope: DiaryEntryScope.CLASS,
          studentScope: DiaryEntryScope.STUDENT,
          ownClassId: ownClassId ?? '00000000-0000-0000-0000-000000000000',
          ownStudentId: user.studentId ?? '00000000-0000-0000-0000-000000000000',
        },
      );
    }
    // Any other role (e.g. School Admin): no extra filter — tenant scoping
    // via scopedRepo/RLS is the only restriction, matching the read-only
    // reference-data convention already established this session.

    if (query.class_id) qb.andWhere('entry.class_id = :qClassId', { qClassId: query.class_id });
    if (query.student_id) qb.andWhere('entry.student_id = :qStudentId', { qStudentId: query.student_id });
    if (query.from_date) qb.andWhere('entry.entry_date >= :fromDate', { fromDate: query.from_date });
    if (query.to_date) qb.andWhere('entry.entry_date <= :toDate', { toDate: query.to_date });

    return qb.orderBy('entry.entry_date', 'DESC').getMany();
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const entry = await this.repo().findOne({ where: { id, tenant_id: user.tenantId }, relations: ['replies'] });
    if (!entry) throw new NotFoundException('Diary entry not found');
    await this.assertCanView(entry, user);
    return entry;
  }

  async update(id: string, dto: UpdateDiaryEntryDto, user: AuthenticatedUser) {
    const entry = await this.repo().findOne({ where: { id, tenant_id: user.tenantId } });
    if (!entry) throw new NotFoundException('Diary entry not found');
    if (entry.author_id !== user.userId) {
      throw new ForbiddenException('Only the author can edit this entry');
    }
    Object.assign(entry, dto);
    return this.repo().save(entry);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const entry = await this.repo().findOne({ where: { id, tenant_id: user.tenantId } });
    if (!entry) throw new NotFoundException('Diary entry not found');
    const hasAdminDeletePermission = (user.permissions ?? []).some(
      (p) => p.module === 'communication' && p.action === 'delete',
    );
    if (entry.author_id !== user.userId && !hasAdminDeletePermission) {
      throw new ForbiddenException('Not permitted to delete this entry');
    }
    await this.repo().softDelete(entry.id);
    return { deleted: true };
  }

  async addReply(entryId: string, dto: CreateDiaryReplyDto, user: AuthenticatedUser) {
    const entry = await this.repo().findOne({ where: { id: entryId, tenant_id: user.tenantId } });
    if (!entry) throw new NotFoundException('Diary entry not found');

    if (user.roleName === 'Student') {
      throw new ForbiddenException('Students cannot reply to diary entries');
    }
    if (user.roleName === 'Teacher' && entry.author_id !== user.userId) {
      throw new ForbiddenException('Only the authoring teacher can reply as staff');
    }
    if (user.roleName === 'Parent') {
      const linkedStudentIds = user.parentOfStudentIds ?? [];
      const linkedClassIds = await this.getClassIdsForStudents(linkedStudentIds);
      const isLinked =
        (entry.scope === DiaryEntryScope.STUDENT && linkedStudentIds.includes(entry.student_id!)) ||
        (entry.scope === DiaryEntryScope.CLASS && linkedClassIds.includes(entry.class_id));
      if (!isLinked) {
        throw new ForbiddenException('Not linked to this entry');
      }
    }

    const reply = this.replyRepo().create({
      tenant_id: user.tenantId,
      diary_entry_id: entryId,
      author_id: user.userId,
      content: dto.content,
    });
    return this.replyRepo().save(reply);
  }

  private async assertCanView(entry: DiaryEntry, user: AuthenticatedUser) {
    const hasStaffViewPermission = (user.permissions ?? []).some(
      (p) => p.module === 'communication' && p.action === 'view',
    );
    if (hasStaffViewPermission) return;

    if (user.roleName === 'Teacher') {
      const classIds = await this.timetableService.findClassIdsForTeacher(user.tenantId, user.userId);
      if (classIds.length === 0 || classIds.includes(entry.class_id)) return;
    }

    if (user.roleName === 'Parent') {
      const linkedStudentIds = user.parentOfStudentIds ?? [];
      if (entry.scope === DiaryEntryScope.STUDENT && linkedStudentIds.includes(entry.student_id!)) return;
      if (entry.scope === DiaryEntryScope.CLASS) {
        const linkedClassIds = await this.getClassIdsForStudents(linkedStudentIds);
        if (linkedClassIds.includes(entry.class_id)) return;
      }
    }

    if (user.roleName === 'Student') {
      const ownClassId = await this.getOwnClassId(user.studentId);
      if (entry.scope === DiaryEntryScope.CLASS && entry.class_id === ownClassId) return;
      if (entry.scope === DiaryEntryScope.STUDENT && entry.student_id === user.studentId) return;
    }

    throw new ForbiddenException('Not permitted to view this entry');
  }

  private async getClassIdsForStudents(studentIds: string[]): Promise<string[]> {
    if (studentIds.length === 0) return [];
    const students = await this.studentsRepo().find({ where: { id: In(studentIds) } });
    return students.map((s) => s.school_class_id).filter((id): id is string => Boolean(id));
  }

  private async getOwnClassId(studentId?: string): Promise<string | null> {
    if (!studentId) return null;
    const student = await this.studentsRepo().findOne({ where: { id: studentId } });
    return student?.school_class_id ?? null;
  }
}