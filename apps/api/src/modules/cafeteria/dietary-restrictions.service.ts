import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentDietaryRestriction } from './entities/student-dietary-restriction.entity';
import { CreateDietaryRestrictionDto } from './dto/create-dietary-restriction.dto';
import { UpdateDietaryRestrictionDto } from './dto/update-dietary-restriction.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class DietaryRestrictionsService {
  constructor(
    @InjectRepository(StudentDietaryRestriction)
    private readonly restrictionRepo: Repository<StudentDietaryRestriction>,
  ) {}

  private repo(): Repository<StudentDietaryRestriction> {
    return scopedRepo(this.restrictionRepo, StudentDietaryRestriction);
  }

  create(dto: CreateDietaryRestrictionDto, recordedBy: string): Promise<StudentDietaryRestriction> {
    return this.repo().save(this.repo().create({ ...dto, recorded_by: recordedBy }));
  }

  findAllForTenant(tenantId: string, studentId?: string): Promise<StudentDietaryRestriction[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (studentId) where.student_id = studentId;
    return this.repo().find({ where });
  }

  async update(id: string, dto: UpdateDietaryRestrictionDto): Promise<StudentDietaryRestriction> {
    const restriction = await this.repo().findOne({ where: { id } });
    if (!restriction) throw new NotFoundException(`Dietary restriction ${id} not found`);
    Object.assign(restriction, dto);
    return this.repo().save(restriction);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Dietary restriction ${id} not found`);
  }
}
