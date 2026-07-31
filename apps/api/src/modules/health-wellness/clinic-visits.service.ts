import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicVisit } from './entities/clinic-visit.entity';
import { Student } from '../students/entities/student.entity';
import { CreateClinicVisitDto } from './dto/create-clinic-visit.dto';
import { UpdateClinicVisitDto } from './dto/update-clinic-visit.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { assertStudentInTeacherScope, getScopedStudentIds } from '../../common/utils/teacher-student-scope.util';


@Injectable()
export class ClinicVisitsService {
  constructor(
    @InjectRepository(ClinicVisit) private readonly visitRepo: Repository<ClinicVisit>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<ClinicVisit> {
    return scopedRepo(this.visitRepo, ClinicVisit);
  }

  create(dto: CreateClinicVisitDto, recordedBy: string): Promise<ClinicVisit> {
    return this.repo().save(this.repo().create({ ...dto, recorded_by: recordedBy }));
  }

  async findAllForTenant(tenantId: string, teacherId?: string, studentId?: string): Promise<ClinicVisit[]> {
    const qb = this.repo().createQueryBuilder('v').where('v.tenant_id = :tenantId', { tenantId });
    if (studentId) qb.andWhere('v.student_id = :studentId', { studentId });
    if (teacherId) {
      const scopedIds = await getScopedStudentIds(this.timetableService, this.studentRepo, tenantId, teacherId);
      if (scopedIds !== null) qb.andWhere('v.student_id IN (:...ids)', { ids: scopedIds.length ? scopedIds : [null] });
    }
    return qb.orderBy('v.visit_date', 'DESC').getMany();
  }

  async findOne(id: string, tenantId?: string, teacherId?: string): Promise<ClinicVisit> {
    const visit = await this.repo().findOne({ where: { id } });
    if (!visit) throw new NotFoundException(`Clinic visit ${id} not found`);
    if (teacherId && tenantId) {
      await assertStudentInTeacherScope(this.timetableService, this.studentRepo, tenantId, teacherId, visit.student_id);
    }
    return visit;
  }

  async update(id: string, dto: UpdateClinicVisitDto): Promise<ClinicVisit> {
    const visit = await this.repo().findOne({ where: { id } });
    if (!visit) throw new NotFoundException(`Clinic visit ${id} not found`);
    Object.assign(visit, dto);
    return this.repo().save(visit);
  }
}
