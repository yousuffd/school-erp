import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffAttendanceRecord } from './entities/staff-attendance-record.entity';
import { RecordStaffAttendanceDto } from './dto/record-staff-attendance.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class StaffAttendanceService {
  constructor(
    @InjectRepository(StaffAttendanceRecord) private readonly repoRaw: Repository<StaffAttendanceRecord>,
  ) {}

  private repo(): Repository<StaffAttendanceRecord> {
    return scopedRepo(this.repoRaw, StaffAttendanceRecord);
  }

  async recordBulk(dto: RecordStaffAttendanceDto): Promise<StaffAttendanceRecord[]> {
    const results: StaffAttendanceRecord[] = [];
    for (const entry of dto.entries) {
      let record = await this.repo().findOne({
        where: { tenant_id: dto.tenant_id, employee_id: entry.employee_id, date: dto.date },
      });
      if (record) {
        record.status = entry.status;
      } else {
        record = this.repo().create({
          tenant_id: dto.tenant_id,
          employee_id: entry.employee_id,
          date: dto.date,
          status: entry.status,
        });
      }
      results.push(await this.repo().save(record));
    }
    return results;
  }

  findForDate(tenantId: string, date: string): Promise<StaffAttendanceRecord[]> {
    return this.repo().find({ where: { tenant_id: tenantId, date } });
  }

  findForEmployee(employeeId: string, from?: string, to?: string): Promise<StaffAttendanceRecord[]> {
    const qb = this.repo().createQueryBuilder('a').where('a.employee_id = :employeeId', { employeeId });
    if (from) qb.andWhere('a.date >= :from', { from });
    if (to) qb.andWhere('a.date <= :to', { to });
    return qb.orderBy('a.date', 'DESC').getMany();
  }
}