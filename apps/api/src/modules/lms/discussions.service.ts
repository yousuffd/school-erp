import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DiscussionThread } from './entities/discussion-thread.entity';
import { DiscussionPost } from './entities/discussion-post.entity';
import { CreateDiscussionThreadDto, CreateDiscussionPostDto } from './dto/discussion.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { TimetableService } from '../timetable/timetable.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertClassAccess } from './utils/class-access.util';
import { assertTeacherClassSubjectAccess } from '../../common/utils/teacher-class-scope.util';

export interface ThreadQuery {
  schoolClassId?: string;
  subjectId?: string;
}

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectRepository(DiscussionThread) private readonly threadRepo: Repository<DiscussionThread>,
    @InjectRepository(DiscussionPost) private readonly postRepo: Repository<DiscussionPost>,
    private readonly studentsService: StudentsService,
    private readonly timetableService: TimetableService,
  ) {}

  private threads(): Repository<DiscussionThread> {
    return scopedRepo(this.threadRepo, DiscussionThread);
  }
  private posts(): Repository<DiscussionPost> {
    return scopedRepo(this.postRepo, DiscussionPost);
  }

  /**
   * Whether `user` is the student who owns `schoolClassId` — used to
   * decide whether the additional teacher-class-subject layer below
   * applies. Mirrors LearningResourcesService/LecturesService's identical
   * helper.
   */
  private async isOwningStudent(user: AuthenticatedUser, schoolClassId: string): Promise<boolean> {
    if (!user.studentId) return false;
    const student = await this.studentsService.findOne(user.studentId);
    return student.school_class_id === schoolClassId;
  }

  /**
   * Teacher-class-AND-subject-scoped: previously had NO ownership check
   * at all beyond the lms:create permission gate — any staff member could
   * start a thread tagged to any class+subject combination tenant-wide.
   */
  async createThread(dto: CreateDiscussionThreadDto, createdBy: string): Promise<DiscussionThread> {
    await assertTeacherClassSubjectAccess(
      this.timetableService,
      dto.tenant_id,
      createdBy,
      dto.school_class_id,
      dto.subject_id,
    );
    return this.threads().save(
      this.threads().create({
        tenant_id: dto.tenant_id,
        subject_id: dto.subject_id,
        school_class_id: dto.school_class_id,
        academic_year_id: dto.academic_year_id,
        title: dto.title,
        created_by: createdBy,
      }),
    );
  }

  /**
   * teacherId passed unconditionally for every caller (Admin included),
   * same convention as the other 3 LMS controllers already scoped this
   * session. Previously had no teacherId parameter at all — the
   * controller never received @CurrentUser().
   */
  async findAllForTenant(tenantId: string, query: ThreadQuery, teacherId?: string): Promise<DiscussionThread[]> {
    const qb = this.threads().createQueryBuilder('t').where('t.tenant_id = :tenantId', { tenantId });
    if (query.schoolClassId) qb.andWhere('t.school_class_id = :schoolClassId', { schoolClassId: query.schoolClassId });
    if (query.subjectId) qb.andWhere('t.subject_id = :subjectId', { subjectId: query.subjectId });

    if (teacherId) {
      const pairs = await this.timetableService.findClassSubjectPairsForTeacher(tenantId, teacherId);
      if (pairs.length > 0) {
        qb.andWhere(
          new Brackets((sub) => {
            pairs.forEach((pair, index) => {
              const clause = `(t.school_class_id = :classId${index} AND t.subject_id = :subjectId${index})`;
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

    return qb.orderBy('t.created_at', 'DESC').getMany();
  }

  async findForStudent(user: AuthenticatedUser): Promise<DiscussionThread[]> {
    if (!user.studentId) return [];
    const student = await this.studentsService.findOne(user.studentId);
    if (!student.school_class_id) return [];
    return this.threads().find({
      where: { tenant_id: user.tenantId, school_class_id: student.school_class_id },
      order: { created_at: 'DESC' },
    });
  }

  private async getThreadOrThrow(threadId: string): Promise<DiscussionThread> {
    const thread = await this.threads().findOne({ where: { id: threadId } });
    if (!thread) throw new NotFoundException(`Thread ${threadId} not found`);
    return thread;
  }

  /**
   * Dual staff-OR-own-class-student authorization via the shared
   * assertClassAccess (unchanged — still shared with Resources/Lectures).
   * Teacher-class-AND-subject-scoping layered on TOP this session: the
   * permission check alone let any staff member with lms:view read any
   * thread's posts tenant-wide, regardless of which class/subject they
   * actually teach. The owning-student branch needs no further check.
   */
  async findPosts(threadId: string, user: AuthenticatedUser): Promise<DiscussionPost[]> {
    const thread = await this.getThreadOrThrow(threadId);
    await assertClassAccess(user, thread.school_class_id, this.studentsService, 'view');

    const isOwner = await this.isOwningStudent(user, thread.school_class_id);
    if (!isOwner) {
      await assertTeacherClassSubjectAccess(
        this.timetableService,
        user.tenantId,
        user.userId,
        thread.school_class_id,
        thread.subject_id,
      );
    }

    return this.posts().find({ where: { thread_id: threadId }, order: { created_at: 'ASC' } });
  }

  /**
   * Genuinely dual-use, unlike the other 3 LMS controllers' create()
   * routes: BOTH a staff member (typically the teacher) and a student in
   * the thread's own class legitimately post replies here. assertClassAccess
   * (unchanged) still gates on 'create' permission OR owning-student, same
   * as before. Teacher-class-AND-subject-scoping layered on TOP this
   * session, but ONLY for the non-student (staff) branch — a student
   * replying in their own class's thread needs no further check, same
   * reasoning as findPosts above.
   */
  async createPost(threadId: string, dto: CreateDiscussionPostDto, user: AuthenticatedUser): Promise<DiscussionPost> {
    const thread = await this.getThreadOrThrow(threadId);
    // Posting is a write, so checked against 'create' rather than 'view' —
    // a staff member with only view access (if that combination ever
    // existed) couldn't post, matching the module-permission model used
    // everywhere else.
    await assertClassAccess(user, thread.school_class_id, this.studentsService, 'create');

    const isOwner = await this.isOwningStudent(user, thread.school_class_id);
    if (!isOwner) {
      await assertTeacherClassSubjectAccess(
        this.timetableService,
        user.tenantId,
        user.userId,
        thread.school_class_id,
        thread.subject_id,
      );
    }

    const post = this.posts().create({
      tenant_id: thread.tenant_id,
      thread_id: threadId,
      author_id: user.userId,
      content: dto.content,
    });
    return this.posts().save(post);
  }

  /**
   * Teacher-class-AND-subject-scoped this session: previously had NO
   * ownership check at all beyond the lms:delete permission gate, and
   * didn't even verify the thread existed first (a delete against a
   * nonexistent id silently no-op'd rather than 404ing) — both fixed
   * together since the existence check is needed to know the thread's
   * class+subject anyway.
   */
  async removeThread(id: string, user: AuthenticatedUser): Promise<{ deleted: boolean }> {
    const thread = await this.getThreadOrThrow(id);

    await assertTeacherClassSubjectAccess(
      this.timetableService,
      user.tenantId,
      user.userId,
      thread.school_class_id,
      thread.subject_id,
    );

    await this.threads().delete(id);
    return { deleted: true };
  }
}