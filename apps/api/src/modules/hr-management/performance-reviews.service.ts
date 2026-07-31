import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceReview } from './entities/performance-review.entity';
import { PerformanceReviewCycle, ReviewCycleStatus } from './entities/performance-review-cycle.entity';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { CalibrateReviewDto } from './dto/calibrate-review.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class PerformanceReviewsService {
  constructor(
    @InjectRepository(PerformanceReview) private readonly reviewRepo: Repository<PerformanceReview>,
    @InjectRepository(PerformanceReviewCycle) private readonly cycleRepo: Repository<PerformanceReviewCycle>,
  ) {}

  private repo(): Repository<PerformanceReview> {
    return scopedRepo(this.reviewRepo, PerformanceReview);
  }
  private cycles(): Repository<PerformanceReviewCycle> {
    return scopedRepo(this.cycleRepo, PerformanceReviewCycle);
  }

  async create(dto: CreatePerformanceReviewDto): Promise<PerformanceReview> {
    const cycle = await this.cycles().findOne({ where: { id: dto.cycle_id } });
    if (!cycle) throw new NotFoundException(`Review cycle ${dto.cycle_id} not found`);
    if (cycle.status !== ReviewCycleStatus.OPEN) {
      throw new BadRequestException(`Cycle is ${cycle.status} — reviews can only be submitted while a cycle is open.`);
    }
    // One row per (employee, reviewer_type) per cycle — a peer can't submit twice, but multiple distinct peer reviewers aren't distinguished from each other (reviewer_id still recorded, just not enforced unique beyond type).
    return this.repo().save(this.repo().create(dto));
  }

  findForCycle(cycleId: string): Promise<PerformanceReview[]> {
    return this.repo().find({ where: { cycle_id: cycleId } });
  }

  findForEmployee(employeeId: string): Promise<PerformanceReview[]> {
    return this.repo().find({ where: { employee_id: employeeId }, order: { created_at: 'DESC' } });
  }

  async calibrate(id: string, dto: CalibrateReviewDto): Promise<PerformanceReview> {
    const review = await this.repo().findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    const cycle = await this.cycles().findOne({ where: { id: review.cycle_id } });
    if (cycle?.status !== ReviewCycleStatus.CALIBRATING) {
      throw new BadRequestException(`Cycle must be in calibration to set a calibrated rating (currently ${cycle?.status}).`);
    }
    review.calibrated_rating = dto.calibrated_rating;
    return this.repo().save(review);
  }
}