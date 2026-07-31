import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, LeaveRequestStatus } from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class LeaveRequestsService {
  constructor(@InjectRepository(LeaveRequest) private readonly repoRaw: Repository<LeaveRequest>) {}

  private repo(): Repository<LeaveRequest> {
    return scopedRepo(this.repoRaw, LeaveRequest);
  }

  create(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    if (new Date(dto.to_date) < new Date(dto.from_date)) {
      throw new BadRequestException('to_date cannot be before from_date');
    }
    return this.repo().save(this.repo().create({ ...dto, status: LeaveRequestStatus.PENDING }));
  }

  findAllForTenant(
    tenantId: string,
    filters?: { employeeId?: string; status?: LeaveRequestStatus },
  ): Promise<LeaveRequest[]> {
    const where: any = { tenant_id: tenantId };
    if (filters?.employeeId) where.employee_id = filters.employeeId;
    if (filters?.status) where.status = filters.status;
    return this.repo().find({ where, order: { from_date: 'DESC' } });
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const request = await this.repo().findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Leave request ${id} not found`);
    return request;
  }

  async decide(id: string, status: LeaveRequestStatus.APPROVED | LeaveRequestStatus.REJECTED, approvedBy: string): Promise<LeaveRequest> {
    const request = await this.findOne(id);
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(`Leave request already ${request.status} — cannot change a decided request.`);
    }
    request.status = status;
    request.approved_by = approvedBy;
    return this.repo().save(request);
  }

  /** Self-service — the logged-in employee's own leave requests. */
  findForEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return this.repo().find({ where: { employee_id: employeeId }, order: { from_date: 'DESC' } });
  }
}