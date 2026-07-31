import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest, MaintenanceRequestStatus } from './entities/maintenance-request.entity';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class MaintenanceRequestsService {
  constructor(
    @InjectRepository(MaintenanceRequest) private readonly requestRepo: Repository<MaintenanceRequest>,
  ) {}

  private repo(): Repository<MaintenanceRequest> {
    return scopedRepo(this.requestRepo, MaintenanceRequest);
  }

  create(dto: CreateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    return this.repo().save(this.repo().create({ ...dto, status: MaintenanceRequestStatus.OPEN }));
  }

  findAllForTenant(tenantId: string, status?: MaintenanceRequestStatus): Promise<MaintenanceRequest[]> {
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    return this.repo().find({ where, order: { reported_date: 'DESC' } });
  }

  async updateStatus(id: string, status: MaintenanceRequestStatus, resolvedDate?: string): Promise<MaintenanceRequest> {
    const request = await this.repo().findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Maintenance request ${id} not found`);
    request.status = status;
    if (status === MaintenanceRequestStatus.RESOLVED && resolvedDate) request.resolved_date = resolvedDate;
    return this.repo().save(request);
  }
}