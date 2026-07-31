import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOpening } from './entities/job-opening.entity';
import { CreateJobOpeningDto } from './dto/create-job-opening.dto';
import { UpdateJobOpeningStatusDto } from './dto/update-job-opening-status.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class JobOpeningsService {
  constructor(@InjectRepository(JobOpening) private readonly repoRaw: Repository<JobOpening>) {}

  private repo(): Repository<JobOpening> {
    return scopedRepo(this.repoRaw, JobOpening);
  }

  create(dto: CreateJobOpeningDto): Promise<JobOpening> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, status?: JobOpening['status']): Promise<JobOpening[]> {
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    return this.repo().find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<JobOpening> {
    const opening = await this.repo().findOne({ where: { id } });
    if (!opening) throw new NotFoundException(`Job opening ${id} not found`);
    return opening;
  }

  async updateStatus(id: string, dto: UpdateJobOpeningStatusDto): Promise<JobOpening> {
    const opening = await this.findOne(id);
    opening.status = dto.status;
    return this.repo().save(opening);
  }
}