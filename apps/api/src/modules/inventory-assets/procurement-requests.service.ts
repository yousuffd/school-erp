import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcurementRequest, ProcurementRequestStatus } from './entities/procurement-request.entity';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto';
import { UpdateProcurementRequestStatusDto } from './dto/update-procurement-request-status.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { todayLocalDateStr } from '../../common/utils/local-date.util';

// Only these forward transitions are allowed — no jumping straight from
// pending to fulfilled, and nothing moves once rejected or fulfilled.
const ALLOWED_TRANSITIONS: Record<ProcurementRequestStatus, ProcurementRequestStatus[]> = {
  [ProcurementRequestStatus.PENDING]: [ProcurementRequestStatus.APPROVED, ProcurementRequestStatus.REJECTED],
  [ProcurementRequestStatus.APPROVED]: [ProcurementRequestStatus.FULFILLED],
  [ProcurementRequestStatus.REJECTED]: [],
  [ProcurementRequestStatus.FULFILLED]: [],
};

@Injectable()
export class ProcurementRequestsService {
  constructor(
    @InjectRepository(ProcurementRequest) private readonly requestRepo: Repository<ProcurementRequest>,
  ) {}

  private repo(): Repository<ProcurementRequest> {
    return scopedRepo(this.requestRepo, ProcurementRequest);
  }

  create(dto: CreateProcurementRequestDto, requestedBy: string): Promise<ProcurementRequest> {
    return this.repo().save(this.repo().create({ ...dto, requested_by: requestedBy }));
  }

  findAllForTenant(tenantId: string, status?: string): Promise<ProcurementRequest[]> {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (status) where.status = status;
    return this.repo().find({ where, order: { requested_date: 'DESC' } });
  }

  /**
   * Fulfilling a request does NOT automatically create a StockTransaction
   * — approval/fulfillment on paper and the physical stock actually
   * arriving aren't always the same moment, so recording the receipt is a
   * deliberate separate action via StockService.recordTransaction, not
   * bundled into this call.
   */
  async updateStatus(id: string, dto: UpdateProcurementRequestStatusDto, actedBy: string): Promise<ProcurementRequest> {
    const request = await this.repo().findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Procurement request ${id} not found`);

    if (!ALLOWED_TRANSITIONS[request.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move a ${request.status} request to ${dto.status}.`,
      );
    }

    request.status = dto.status;
    if (dto.notes) request.notes = dto.notes;
    if (dto.status === ProcurementRequestStatus.APPROVED || dto.status === ProcurementRequestStatus.REJECTED) {
      request.approved_by = actedBy;
      request.approval_date = new Date().toISOString().slice(0, 10);
    }
    return this.repo().save(request);
  }
}
