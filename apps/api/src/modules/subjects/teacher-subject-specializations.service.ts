import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherSubjectSpecialization } from './entities/teacher-subject-specialization.entity';
import { AssignTeacherSpecializationDto } from './dto/assign-teacher-specialization.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class TeacherSubjectSpecializationsService {
  constructor(
    @InjectRepository(TeacherSubjectSpecialization)
    private readonly repo_: Repository<TeacherSubjectSpecialization>,
  ) {}

  private repo(): Repository<TeacherSubjectSpecialization> {
    return scopedRepo(this.repo_, TeacherSubjectSpecialization);
  }

  /**
   * Upsert by (tenant_id, teacher_id) — a teacher has exactly one
   * specialization at a time. Reassigning updates the existing row rather
   * than erroring, since a teacher's specialty can genuinely change
   * (e.g. staffing changes between years), and this isn't a self-service
   * route a Student/Teacher could abuse — gated on academic-management:edit.
   */
  async assign(dto: AssignTeacherSpecializationDto): Promise<TeacherSubjectSpecialization> {
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, teacher_id: dto.teacher_id },
    });
    if (existing) {
      existing.subject_id = dto.subject_id;
      return this.repo().save(existing);
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<TeacherSubjectSpecialization[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  findBySubject(tenantId: string, subjectId: string): Promise<TeacherSubjectSpecialization[]> {
    return this.repo().find({ where: { tenant_id: tenantId, subject_id: subjectId } });
  }

  findByTeacher(teacherId: string): Promise<TeacherSubjectSpecialization | null> {
    return this.repo().findOne({ where: { teacher_id: teacherId } });
  }

  async remove(id: string): Promise<void> {
    await this.repo().delete(id);
  }
}