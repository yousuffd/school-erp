import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuccessionPlan } from './entities/succession-plan.entity';
import { CreateSuccessionPlanDto } from './dto/create-succession-plan.dto';
import { UpdateSuccessionPlanDto } from './dto/update-succession-plan.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class SuccessionPlansService {
  constructor(@InjectRepository(SuccessionPlan) private readonly repoRaw: Repository<SuccessionPlan>) {}

  private repo(): Repository<SuccessionPlan> {
    return scopedRepo(this.repoRaw, SuccessionPlan);
  }

  create(dto: CreateSuccessionPlanDto): Promise<SuccessionPlan> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<SuccessionPlan[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  async update(id: string, dto: UpdateSuccessionPlanDto): Promise<SuccessionPlan> {
    const plan = await this.repo().findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Succession plan ${id} not found`);
    Object.assign(plan, dto);
    return this.repo().save(plan);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Succession plan ${id} not found`);
  }
}