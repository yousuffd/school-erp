import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceReviewCycle, ReviewCycleStatus } from './entities/performance-review-cycle.entity';
import { CreateReviewCycleDto } from './dto/create-review-cycle.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class PerformanceReviewCyclesService {
  constructor(
    @InjectRepository(PerformanceReviewCycle) private readonly repoRaw: Repository<PerformanceReviewCycle>,
  ) {}

  private repo(): Repository<PerformanceReviewCycle> {
    return scopedRepo(this.repoRaw, PerformanceReviewCycle);
  }

  create(dto: CreateReviewCycleDto): Promise<PerformanceReviewCycle> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<PerformanceReviewCycle[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { start_date: 'DESC' } });
  }

  async findOne(id: string): Promise<PerformanceReviewCycle> {
    const cycle = await this.repo().findOne({ where: { id } });
    if (!cycle) throw new NotFoundException(`Review cycle ${id} not found`);
    return cycle;
  }

  /** Moves a cycle into calibration — reviews can still be read but the calibration step (setting calibrated_rating) only makes sense once this happens. */
  async startCalibration(id: string): Promise<PerformanceReviewCycle> {
    const cycle = await this.findOne(id);
    if (cycle.status !== ReviewCycleStatus.OPEN) {
      throw new BadRequestException(`Cycle must be open to start calibration (currently ${cycle.status}).`);
    }
    cycle.status = ReviewCycleStatus.CALIBRATING;
    return this.repo().save(cycle);
  }

  async close(id: string): Promise<PerformanceReviewCycle> {
    const cycle = await this.findOne(id);
    if (cycle.status !== ReviewCycleStatus.CALIBRATING) {
      throw new BadRequestException(`Cycle must be in calibration to close (currently ${cycle.status}).`);
    }
    cycle.status = ReviewCycleStatus.CLOSED;
    return this.repo().save(cycle);
  }
}