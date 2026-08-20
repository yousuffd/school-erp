import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleMaintenanceRecord, MaintenanceRecordStatus } from './entities/vehicle-maintenance-record.entity';
import { CreateVehicleMaintenanceRecordDto } from './dto/create-vehicle-maintenance-record.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { todayLocalDateStr } from '../../common/utils/local-date.util';

@Injectable()
export class VehicleMaintenanceService {
  constructor(@InjectRepository(VehicleMaintenanceRecord) private readonly repoRaw: Repository<VehicleMaintenanceRecord>) {}

  private repo(): Repository<VehicleMaintenanceRecord> {
    return scopedRepo(this.repoRaw, VehicleMaintenanceRecord);
  }

  create(dto: CreateVehicleMaintenanceRecordDto): Promise<VehicleMaintenanceRecord> {
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, vehicleId?: string, status?: MaintenanceRecordStatus): Promise<VehicleMaintenanceRecord[]> {
    const where: any = { tenant_id: tenantId };
    if (vehicleId) where.vehicle_id = vehicleId;
    if (status) where.status = status;
    return this.repo().find({ where, order: { scheduled_date: 'DESC' } });
  }

  /**
   * Scheduled records past their scheduled_date without a completed_date
   * are flagged 'overdue' on read, not via a scheduled job — same
   * "compute rather than store a staleness-prone flag" convention as
   * StaffCertificationsService.findExpiringSoon().
   */
  async findAllForTenantWithOverdueCheck(tenantId: string, vehicleId?: string): Promise<VehicleMaintenanceRecord[]> {
    const records = await this.findAllForTenant(tenantId, vehicleId);
    const today = new Date().toISOString().slice(0, 10);
    return records.map((r) => {
      if (r.status === MaintenanceRecordStatus.SCHEDULED && r.scheduled_date < today) {
        return { ...r, status: MaintenanceRecordStatus.OVERDUE };
      }
      return r;
    });
  }

  async markCompleted(id: string, completedDate: string, cost?: string): Promise<VehicleMaintenanceRecord> {
    const record = await this.repo().findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Maintenance record ${id} not found`);
    if (record.status === MaintenanceRecordStatus.COMPLETED) {
      throw new BadRequestException('This maintenance record is already marked completed.');
    }
    record.status = MaintenanceRecordStatus.COMPLETED;
    record.completed_date = completedDate;
    if (cost) record.cost = cost;
    return this.repo().save(record);
  }
}