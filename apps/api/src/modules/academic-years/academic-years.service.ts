import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from './entities/academic-year.entity';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class AcademicYearsService {
  constructor(
    @InjectRepository(AcademicYear) private readonly yearRepo: Repository<AcademicYear>,
  ) {}

  private repo(): Repository<AcademicYear> {
    return scopedRepo(this.yearRepo, AcademicYear);
  }

  async create(dto: CreateAcademicYearDto): Promise<AcademicYear> {
    if (dto.is_current) {
      await this.repo().update({ tenant_id: dto.tenant_id }, { is_current: false });
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<AcademicYear[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { start_date: 'DESC' } });
  }

  async findOne(id: string): Promise<AcademicYear> {
    const year = await this.repo().findOne({ where: { id } });
    if (!year) throw new NotFoundException(`Academic year ${id} not found`);
    return year;
  }

  /** PATCH /academic-years/:id/set-current — kickoff §7 API contract. */
  async setCurrent(id: string): Promise<AcademicYear> {
    const year = await this.repo().findOne({ where: { id } });
    if (!year) throw new NotFoundException(`Academic year ${id} not found`);
    await this.repo().update({ tenant_id: year.tenant_id }, { is_current: false });
    year.is_current = true;
    return this.repo().save(year);
  }
  async findCurrentForTenant(tenantId: string): Promise<AcademicYear> {
    const year = await this.repo().findOne({ where: { tenant_id: tenantId, is_current: true } });
    if (!year) throw new NotFoundException('No current academic year is set for this tenant');
    return year;
  }
}
