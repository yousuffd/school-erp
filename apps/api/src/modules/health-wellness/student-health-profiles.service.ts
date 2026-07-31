import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentHealthProfile } from './entities/student-health-profile.entity';
import { Student } from '../students/entities/student.entity';
import { UpsertStudentHealthProfileDto } from './dto/upsert-student-health-profile.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { assertStudentInTeacherScope, getScopedStudentIds } from '../../common/utils/teacher-student-scope.util';

@Injectable()
export class StudentHealthProfilesService {
  constructor(
    @InjectRepository(StudentHealthProfile) private readonly profileRepo: Repository<StudentHealthProfile>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<StudentHealthProfile> {
    return scopedRepo(this.profileRepo, StudentHealthProfile);
  }

  /** Create-or-update — one profile per student, upsert on the (tenant_id, student_id) unique index rather than separate create/update endpoints. */
  async upsert(dto: UpsertStudentHealthProfileDto, updatedBy: string): Promise<StudentHealthProfile> {
    let profile = await this.repo().findOne({ where: { tenant_id: dto.tenant_id, student_id: dto.student_id } });
    if (profile) {
      Object.assign(profile, dto, { updated_by: updatedBy });
    } else {
      profile = this.repo().create({ ...dto, updated_by: updatedBy });
    }
    return this.repo().save(profile);
  }

  async findAllForTenant(tenantId: string, teacherId?: string): Promise<StudentHealthProfile[]> {
    const qb = this.repo().createQueryBuilder('p').where('p.tenant_id = :tenantId', { tenantId });
    if (teacherId) {
      const scopedIds = await getScopedStudentIds(this.timetableService, this.studentRepo, tenantId, teacherId);
      if (scopedIds !== null) qb.andWhere('p.student_id IN (:...ids)', { ids: scopedIds.length ? scopedIds : [null] });
    }
    return qb.getMany();
  }

  async findByStudent(studentId: string, tenantId: string, teacherId?: string): Promise<StudentHealthProfile> {
    if (teacherId) {
      await assertStudentInTeacherScope(this.timetableService, this.studentRepo, tenantId, teacherId, studentId);
    }
    const profile = await this.repo().findOne({ where: { student_id: studentId } });
    if (!profile) throw new NotFoundException(`No health profile found for student ${studentId}`);
    return profile;
  }
}
