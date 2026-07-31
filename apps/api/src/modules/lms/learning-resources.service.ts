import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { LearningResource } from './entities/learning-resource.entity';
import { CreateLearningResourceDto } from './dto/create-learning-resource.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { TimetableService } from '../timetable/timetable.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertClassAccess } from './utils/class-access.util';
import { assertTeacherClassSubjectAccess } from '../../common/utils/teacher-class-scope.util';

export interface ResourceQuery {
  schoolClassId?: string;
  subjectId?: string;
}

@Injectable()
export class LearningResourcesService {
  constructor(
    @InjectRepository(LearningResource) private readonly repoRaw: Repository<LearningResource>,
    private readonly studentsService: StudentsService,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<LearningResource> {
    return scopedRepo(this.repoRaw, LearningResource);
  }

  /**
   * Whether `user` is the student who owns `schoolClassId` — used to
   * decide whether the additional teacher-class-subject layer below
   * applies. A student who legitimately owns the class needs no further
   * scoping; only the staff branch does.
   */
  private async isOwningStudent(user: AuthenticatedUser, schoolClassId: string): Promise<boolean> {
    if (!user.studentId) return false;
    const student = await this.studentsService.findOne(user.studentId);
    return student.school_class_id === schoolClassId;
  }

  /**
   * Teacher-class-AND-subject-scoped: previously had NO ownership check
   * at all beyond the lms:create permission gate — any staff member could
   * upload a resource tagged to any class+subject combination tenant-wide.
   */
  async create(dto: CreateLearningResourceDto, file: Express.Multer.File, uploadedBy: string): Promise<LearningResource> {
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
        file_path: file.path,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_by: uploadedBy,
      }),
    );
  }

  /**
   * teacherId passed unconditionally for every caller (Admin included),
   * same convention as AssignmentsService.findAllForTenant. Previously
   * had no teacherId parameter at all — the controller never received
   * @CurrentUser(), so no per-teacher filtering was possible; any staff
   * with lms:view saw every resource tenant-wide.
   */
  async findAllForTenant(tenantId: string, query: ResourceQuery, teacherId?: string): Promise<LearningResource[]> {
    const qb = this.repo().createQueryBuilder('r').where('r.tenant_id = :tenantId', { tenantId });
    if (query.schoolClassId) qb.andWhere('r.school_class_id = :schoolClassId', { schoolClassId: query.schoolClassId });
    if (query.subjectId) qb.andWhere('r.subject_id = :subjectId', { subjectId: query.subjectId });

    if (teacherId) {
      const pairs = await this.timetableService.findClassSubjectPairsForTeacher(tenantId, teacherId);
      if (pairs.length > 0) {
        qb.andWhere(
          new Brackets((sub) => {
            pairs.forEach((pair, index) => {
              const clause = `(r.school_class_id = :classId${index} AND r.subject_id = :subjectId${index})`;
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

    return qb.orderBy('r.created_at', 'DESC').getMany();
  }

  async findForStudent(user: AuthenticatedUser): Promise<LearningResource[]> {
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
   * (unchanged — still shared with Lectures/Discussions). Teacher-class-
   * AND-subject-scoping layered on TOP this session: assertClassAccess
   * alone let any staff member with lms:view download any file tenant-
   * wide, since it only checks the permission, not which class/subject
   * the teacher actually teaches. The owning-student branch needs no
   * further check — their access is already the narrower, correct one.
   */
  async getFileForDownload(
    id: string,
    user: AuthenticatedUser,
  ): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const resource = await this.repo().findOne({ where: { id } });
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);

    await assertClassAccess(user, resource.school_class_id, this.studentsService, 'view');

    const isOwner = await this.isOwningStudent(user, resource.school_class_id);
    if (!isOwner) {
      await assertTeacherClassSubjectAccess(
        this.timetableService,
        user.tenantId,
        user.userId,
        resource.school_class_id,
        resource.subject_id,
      );
    }

    return { filePath: resource.file_path, filename: resource.original_filename, mimeType: resource.mime_type };
  }

  /**
   * Teacher-class-AND-subject-scoped: previously had NO ownership check
   * at all beyond the lms:delete permission gate — any staff member could
   * delete any resource tenant-wide.
   */
  async remove(id: string, user: AuthenticatedUser): Promise<{ deleted: boolean }> {
    const resource = await this.repo().findOne({ where: { id } });
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);

    await assertTeacherClassSubjectAccess(
      this.timetableService,
      user.tenantId,
      user.userId,
      resource.school_class_id,
      resource.subject_id,
    );

    if (existsSync(resource.file_path)) {
      await unlink(resource.file_path).catch(() => undefined);
    }
    await this.repo().delete(id);
    return { deleted: true };
  }
}