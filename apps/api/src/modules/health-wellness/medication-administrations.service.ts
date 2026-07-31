import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { Student } from '../students/entities/student.entity';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { getScopedStudentIds } from '../../common/utils/teacher-student-scope.util';

@Injectable()
export class MedicationAdministrationsService {
  constructor(
    @InjectRepository(MedicationAdministration)
    private readonly medicationRepo: Repository<MedicationAdministration>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<MedicationAdministration> {
    return scopedRepo(this.medicationRepo, MedicationAdministration);
  }

  create(dto: CreateMedicationAdministrationDto, administeredBy: string): Promise<MedicationAdministration> {
    return this.repo().save(this.repo().create({ ...dto, administered_by: administeredBy }));
  }

  async findAllForTenant(
    tenantId: string,
    teacherId?: string,
    studentId?: string,
  ): Promise<MedicationAdministration[]> {
    const qb = this.repo().createQueryBuilder('m').where('m.tenant_id = :tenantId', { tenantId });
    if (studentId) qb.andWhere('m.student_id = :studentId', { studentId });
    if (teacherId) {
      const scopedIds = await getScopedStudentIds(this.timetableService, this.studentRepo, tenantId, teacherId);
      if (scopedIds !== null) qb.andWhere('m.student_id IN (:...ids)', { ids: scopedIds.length ? scopedIds : [null] });
    }
    return qb.orderBy('m.administered_at', 'DESC').getMany();
  }
}
