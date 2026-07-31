import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeAdjustment } from './entities/fee-adjustment.entity';
import { CreateFeeAdjustmentDto } from './dto/create-fee-adjustment.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class FeeAdjustmentsService {
  constructor(
    @InjectRepository(FeeAdjustment) private readonly adjustmentRepo: Repository<FeeAdjustment>,
  ) {}

  private repo(): Repository<FeeAdjustment> {
    return scopedRepo(this.adjustmentRepo, FeeAdjustment);
  }

  create(tenantId: string, dto: CreateFeeAdjustmentDto, createdBy: string): Promise<FeeAdjustment> {
    return this.repo().save(
      this.repo().create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  findForAssignment(assignmentId: string): Promise<FeeAdjustment[]> {
    return this.repo().find({ where: { fee_assignment_id: assignmentId }, order: { created_at: 'DESC' } });
  }
}
