import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentTransportOptOut } from './entities/student-transport-opt-out.entity';
import { CreateStudentTransportOptOutDto } from './dto/create-student-transport-opt-out.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class StudentTransportOptOutsService {
  constructor(
    @InjectRepository(StudentTransportOptOut)
    private readonly optOutRepo: Repository<StudentTransportOptOut>,
  ) {}

  private repo(): Repository<StudentTransportOptOut> {
    return scopedRepo(this.optOutRepo, StudentTransportOptOut);
  }

  async create(dto: CreateStudentTransportOptOutDto): Promise<StudentTransportOptOut> {
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, student_id: dto.student_id, academic_year_id: dto.academic_year_id },
    });
    if (existing) {
      // Already opted out for this year — treat as a no-op success rather
      // than an error, since the parent's intent ("keep my child off the
      // list") is already satisfied.
      return existing;
    }
    return this.repo().save(this.repo().create(dto));
  }

  findForStudent(studentId: string): Promise<StudentTransportOptOut[]> {
    return this.repo().find({ where: { student_id: studentId } });
  }

  findAllForTenant(tenantId: string, academicYearId?: string): Promise<StudentTransportOptOut[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (academicYearId) where.academic_year_id = academicYearId;
    return this.repo().find({ where });
  }

  async removeForStudent(studentId: string, academicYearId: string): Promise<void> {
    const result = await this.repo().delete({ student_id: studentId, academic_year_id: academicYearId });
    if (result.affected === 0) {
      throw new NotFoundException('No opt-out found for this student and academic year.');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Opt-out ${id} not found`);
  }
}
