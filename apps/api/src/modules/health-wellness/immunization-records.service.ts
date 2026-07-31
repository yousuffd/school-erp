import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImmunizationRecord } from './entities/immunization-record.entity';
import { Student } from '../students/entities/student.entity';
import { CreateImmunizationRecordDto } from './dto/create-immunization-record.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { assertStudentInTeacherScope, getScopedStudentIds } from '../../common/utils/teacher-student-scope.util';


@Injectable()
export class ImmunizationRecordsService {
  constructor(
    @InjectRepository(ImmunizationRecord) private readonly recordRepo: Repository<ImmunizationRecord>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<ImmunizationRecord> {
    return scopedRepo(this.recordRepo, ImmunizationRecord);
  }

  async create(dto: CreateImmunizationRecordDto, recordedBy: string): Promise<ImmunizationRecord> {
    return this.repo().save(this.repo().create({ ...dto, recorded_by: recordedBy }));
  }

  async findForStudent(studentId: string, tenantId: string, teacherId?: string): Promise<ImmunizationRecord[]> {
    if (teacherId) {
      await assertStudentInTeacherScope(this.timetableService, this.studentRepo, tenantId, teacherId, studentId);
    }
    return this.repo().find({ where: { student_id: studentId }, order: { date_administered: 'DESC' } });
  }

  async findAllForTenant(tenantId: string, teacherId?: string): Promise<ImmunizationRecord[]> {
    const qb = this.repo().createQueryBuilder('r').where('r.tenant_id = :tenantId', { tenantId });
    if (teacherId) {
      const scopedIds = await getScopedStudentIds(this.timetableService, this.studentRepo, tenantId, teacherId);
      if (scopedIds !== null) qb.andWhere('r.student_id IN (:...ids)', { ids: scopedIds.length ? scopedIds : [null] });
    }
    return qb.orderBy('r.date_administered', 'DESC').getMany();
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Immunization record ${id} not found`);
  }
}
