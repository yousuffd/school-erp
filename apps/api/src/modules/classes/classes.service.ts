import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(SchoolClass) private readonly classRepo: Repository<SchoolClass>,
  ) {}

  private repo(): Repository<SchoolClass> {
    return scopedRepo(this.classRepo, SchoolClass);
  }

  async create(dto: CreateSchoolClassDto): Promise<SchoolClass> {
    const existing = await this.repo().findOne({
      where: {
        tenant_id: dto.tenant_id,
        academic_year_id: dto.academic_year_id,
        grade_level: dto.grade_level,
        section: dto.section,
      },
    });
    if (existing) {
      throw new ConflictException(
        `A class already exists for ${dto.grade_level}${dto.section ? ' - ' + dto.section : ''} in this academic year`,
      );
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, academicYearId?: string): Promise<SchoolClass[]> {
    return this.repo().find({
      where: academicYearId
        ? { tenant_id: tenantId, academic_year_id: academicYearId }
        : { tenant_id: tenantId },
      order: { grade_level: 'ASC', section: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SchoolClass> {
    const schoolClass = await this.repo().findOne({ where: { id } });
    if (!schoolClass) throw new NotFoundException(`Class ${id} not found`);
    return schoolClass;
  }

  /**
   * Finds an existing class matching (tenant, academic year, grade, section),
   * creating one if none exists yet. Used by AdmissionsService.enroll() so a
   * newly enrolled student is linked to a real class automatically, instead
   * of landing "Unassigned" and needing a manual follow-up step — the same
   * logic the LinkStudentsToClasses migration used to backfill existing data.
   */
  async findOrCreate(params: {
    tenant_id: string;
    campus_id: string;
    academic_year_id: string;
    grade_level: string;
    section?: string;
  }): Promise<SchoolClass> {
    const existing = await this.repo().findOne({
      where: {
        tenant_id: params.tenant_id,
        academic_year_id: params.academic_year_id,
        grade_level: params.grade_level,
        section: params.section,
      },
    });
    if (existing) return existing;
    return this.repo().save(this.repo().create(params));
  }
}
