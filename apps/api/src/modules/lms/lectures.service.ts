import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { Lecture } from './entities/lecture.entity';
import { LectureProgress } from './entities/lecture-progress.entity';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { TimetableService } from '../timetable/timetable.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertClassAccess } from './utils/class-access.util';
import { assertTeacherClassSubjectAccess } from '../../common/utils/teacher-class-scope.util';
import { JwtService } from '@nestjs/jwt';

export interface LectureQuery {
  schoolClassId?: string;
  subjectId?: string;
}
export interface LectureMediaTokenPayload {
  sub: string;
  tenantId: string;
  studentId?: string;
  lectureId: string;
  purpose: 'lecture-media';
}

@Injectable()
export class LecturesService {
  constructor(
    @InjectRepository(Lecture) private readonly lectureRepo: Repository<Lecture>,
    @InjectRepository(LectureProgress) private readonly progressRepo: Repository<LectureProgress>,
    private readonly studentsService: StudentsService,
    private readonly timetableService: TimetableService,
    private readonly jwtService: JwtService,
  ) {}

  private repo(): Repository<Lecture> {
    return scopedRepo(this.lectureRepo, Lecture);
  }
  private progress(): Repository<LectureProgress> {
    return scopedRepo(this.progressRepo, LectureProgress);
  }

  /**
   * Whether `user` is the student who owns `schoolClassId` — used to
   * decide whether the additional teacher-class-subject layer below
   * applies. Mirrors LearningResourcesService's identical helper.
   */
  private async isOwningStudent(user: AuthenticatedUser, schoolClassId: string): Promise<boolean> {
    if (!user.studentId) return false;
    const student = await this.studentsService.findOne(user.studentId);
    return student.school_class_id === schoolClassId;
  }
  /**
   * Shared ownership/authorization check for accessing a lecture's video —
   * factored out of getFileForDownload so getMediaToken can reuse the exact
   * same logic rather than duplicating it. Throws if unauthorized.
   */
  private async assertLectureAccess(lecture: Lecture, user: AuthenticatedUser): Promise<void> {
    await assertClassAccess(user, lecture.school_class_id, this.studentsService, 'view');
    const isOwner = await this.isOwningStudent(user, lecture.school_class_id);
    if (!isOwner) {
      await assertTeacherClassSubjectAccess(
        this.timetableService,
        user.tenantId,
        user.userId,
        lecture.school_class_id,
        lecture.subject_id,
      );
    }
  }
  /**
   * Teacher-class-AND-subject-scoped: previously had NO ownership check
   * at all beyond the lms:create permission gate — any staff member could
   * upload a lecture tagged to any class+subject combination tenant-wide.
   */
  async create(dto: CreateLectureDto, file: Express.Multer.File, uploadedBy: string): Promise<Lecture> {
    await assertTeacherClassSubjectAccess(
      this.timetableService,
      dto.tenant_id,
      uploadedBy,
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
        description: dto.description,
        video_path: file.path,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_by: uploadedBy,
      }),
    );
  }

  /**
   * teacherId passed unconditionally for every caller (Admin included),
   * same convention as AssignmentsService/LearningResourcesService.
   * Previously had no teacherId parameter at all — the controller never
   * received @CurrentUser(), so no per-teacher filtering was possible.
   */
  async findAllForTenant(tenantId: string, query: LectureQuery, teacherId?: string): Promise<Lecture[]> {
    const qb = this.repo().createQueryBuilder('l').where('l.tenant_id = :tenantId', { tenantId });
    if (query.schoolClassId) qb.andWhere('l.school_class_id = :schoolClassId', { schoolClassId: query.schoolClassId });
    if (query.subjectId) qb.andWhere('l.subject_id = :subjectId', { subjectId: query.subjectId });

    if (teacherId) {
      const pairs = await this.timetableService.findClassSubjectPairsForTeacher(tenantId, teacherId);
      if (pairs.length > 0) {
        qb.andWhere(
          new Brackets((sub) => {
            pairs.forEach((pair, index) => {
              const clause = `(l.school_class_id = :classId${index} AND l.subject_id = :subjectId${index})`;
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

    return qb.orderBy('l.created_at', 'DESC').getMany();
  }

  async findForStudent(user: AuthenticatedUser): Promise<Lecture[]> {
    if (!user.studentId) return [];
    const student = await this.studentsService.findOne(user.studentId);
    if (!student.school_class_id) return [];
    return this.repo().find({
      where: { tenant_id: user.tenantId, school_class_id: student.school_class_id },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Dual staff-OR-own-class authorization via the shared assertClassAccess
   * (unchanged — still shared with Resources/Discussions). Teacher-class-
   * AND-subject-scoping layered on TOP this session: assertClassAccess
   * alone let any staff member with lms:view stream any lecture video
   * tenant-wide, since it only checks the permission, not which class/
   * subject the teacher actually teaches. The owning-student branch needs
   * no further check.
   */
  // async getFileForDownload(
  //   id: string,
  //   user: AuthenticatedUser,
  // ): Promise<{ filePath: string; filename: string; mimeType: string }> {
  //   const lecture = await this.repo().findOne({ where: { id } });
  //   if (!lecture) throw new NotFoundException(`Lecture ${id} not found`);

  //   await assertClassAccess(user, lecture.school_class_id, this.studentsService, 'view');

  //   const isOwner = await this.isOwningStudent(user, lecture.school_class_id);
  //   if (!isOwner) {
  //     await assertTeacherClassSubjectAccess(
  //       this.timetableService,
  //       user.tenantId,
  //       user.userId,
  //       lecture.school_class_id,
  //       lecture.subject_id,
  //     );
  //   }

  //   return { filePath: lecture.video_path, filename: lecture.original_filename, mimeType: lecture.mime_type };
  // }

  async getFileForDownload(
    id: string,
    user: AuthenticatedUser,
  ): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const lecture = await this.repo().findOne({ where: { id } });
    if (!lecture) throw new NotFoundException(`Lecture ${id} not found`);
    await this.assertLectureAccess(lecture, user);
    return { filePath: lecture.video_path, filename: lecture.original_filename, mimeType: lecture.mime_type };
  }

  /**
   * Mints a short-lived (4h), single-lecture-scoped media token — deliberately
   * NOT the full access token, since native <video> tags can't send a custom
   * Authorization header and this token therefore ends up in a URL (browser
   * history, server access logs). Scope is kept minimal: no roleId, no
   * permissions, valid for exactly one lecture. Same ownership check as
   * getFileForDownload runs here, once, at mint time.
   */
  async getMediaToken(id: string, user: AuthenticatedUser): Promise<{ token: string }> {
    const lecture = await this.repo().findOne({ where: { id } });
    if (!lecture) throw new NotFoundException(`Lecture ${id} not found`);
    await this.assertLectureAccess(lecture, user);

    const payload: LectureMediaTokenPayload = {
      sub: user.userId,
      tenantId: user.tenantId,
      studentId: user.studentId,
      lectureId: id,
      purpose: 'lecture-media',
    };
    const token = this.jwtService.sign(payload, { expiresIn: '4h' });
    return { token };
  }

  /**
   * Verifies a media token (see getMediaToken) for the @Public() /file route.
   * Manual jwtService.verify() rather than the normal JwtStrategy/Guard
   * pipeline — same pattern TenantProvisioningGuard and AuthService.refresh()
   * already use for routes outside the standard Bearer-header flow. The
   * ownership check itself already happened once at mint time; this only
   * confirms the token is genuine, unexpired, and scoped to THIS lecture id
   * — not re-running assertLectureAccess, by design, since re-checking on
   * every byte-range request within a single playback session would be
   * wasteful and the token's narrow scope + short life is the actual
   * security boundary here.
   */
  async getFileForMediaToken(
    id: string,
    token: string | undefined,
  ): Promise<{ filePath: string; filename: string; mimeType: string }> {
    if (!token) throw new UnauthorizedException('Missing media token');

    let payload: LectureMediaTokenPayload;
    try {
      payload = this.jwtService.verify<LectureMediaTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired media token');
    }
    if (payload.purpose !== 'lecture-media' || payload.lectureId !== id) {
      throw new UnauthorizedException('Media token not valid for this lecture');
    }

    const lecture = await this.repo().findOne({ where: { id } });
    if (!lecture) throw new NotFoundException(`Lecture ${id} not found`);
    return { filePath: lecture.video_path, filename: lecture.original_filename, mimeType: lecture.mime_type };
  }
  /**
   * Self-service — marks the caller's own progress on this lecture as
   * "watched." Still verifies class access first (a student can't mark a
   * lecture from a class they're not in), even though the write itself
   * only ever touches their own row. Untouched this session — no staff
   * route touches markWatched, same as Assignments' self-service /mine.
   */
  async markWatched(lectureId: string, user: AuthenticatedUser): Promise<LectureProgress> {
    const lecture = await this.repo().findOne({ where: { id: lectureId } });
    if (!lecture) throw new NotFoundException(`Lecture ${lectureId} not found`);
    await assertClassAccess(user, lecture.school_class_id, this.studentsService, 'view');

    const existing = await this.progress().findOne({
      where: { tenant_id: user.tenantId, lecture_id: lectureId, student_id: user.studentId },
    });
    if (existing) return existing;

    const record = this.progress().create({
      tenant_id: user.tenantId,
      lecture_id: lectureId,
      student_id: user.studentId,
    });
    return this.progress().save(record);
  }

  /** Self-service — which of the caller's own class's lectures they've watched. */
  async getMyProgress(user: AuthenticatedUser): Promise<LectureProgress[]> {
    if (!user.studentId) return [];
    return this.progress().find({ where: { tenant_id: user.tenantId, student_id: user.studentId } });
  }

  /**
   * Teacher-class-AND-subject-scoped: previously had NO ownership check
   * at all beyond the lms:delete permission gate — any staff member could
   * delete any lecture tenant-wide.
   */
  async remove(id: string, user: AuthenticatedUser): Promise<{ deleted: boolean }> {
    const lecture = await this.repo().findOne({ where: { id } });
    if (!lecture) throw new NotFoundException(`Lecture ${id} not found`);

    await assertTeacherClassSubjectAccess(
      this.timetableService,
      user.tenantId,
      user.userId,
      lecture.school_class_id,
      lecture.subject_id,
    );

    if (existsSync(lecture.video_path)) {
      await unlink(lecture.video_path).catch(() => undefined);
    }
    await this.repo().delete(id);
    return { deleted: true };
  }
}