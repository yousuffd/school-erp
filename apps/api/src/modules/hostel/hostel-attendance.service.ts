import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HostelAttendanceRecord, HostelAttendanceStatus } from './entities/hostel-attendance-record.entity';
import { RecordHostelAttendanceDto } from './dto/record-hostel-attendance.dto';
import { scopedRepo } from '../../common/context/tenant-context';


@Injectable()
export class HostelAttendanceService {
  constructor(
    @InjectRepository(HostelAttendanceRecord) private readonly attendanceRepo: Repository<HostelAttendanceRecord>,
  ) {}

  private repo(): Repository<HostelAttendanceRecord> {
    return scopedRepo(this.attendanceRepo, HostelAttendanceRecord);
  }

  /**
   * Idempotent per (tenant, student, date) — the unique index on the entity
   * enforces this at the DB level; upsert here so re-submitting the same
   * day's attendance updates rather than throwing (matches Cafeteria's
   * idempotent meal-attendance re-submit convention).
   */
  async recordBulk(dto: RecordHostelAttendanceDto): Promise<HostelAttendanceRecord[]> {
    const results: HostelAttendanceRecord[] = [];
    for (const entry of dto.entries) {
      let record = await this.repo().findOne({
        where: { tenant_id: dto.tenant_id, student_id: entry.student_id, date: dto.date },
      });
      if (record) {
        record.status = entry.status;
        record.curfew_check_in_time = entry.curfew_check_in_time;
      } else {
        record = this.repo().create({
          tenant_id: dto.tenant_id,
          student_id: entry.student_id,
          date: dto.date,
          status: entry.status,
          curfew_check_in_time: entry.curfew_check_in_time,
        });
      }
      results.push(await this.repo().save(record));
    }
    return results;
  }

  findForDate(tenantId: string, date: string): Promise<HostelAttendanceRecord[]> {
    return this.repo().find({ where: { tenant_id: tenantId, date } });
  }

  findForStudent(studentId: string, from?: string, to?: string): Promise<HostelAttendanceRecord[]> {
    const qb = this.repo()
      .createQueryBuilder('a')
      .where('a.student_id = :studentId', { studentId });
    if (from) qb.andWhere('a.date >= :from', { from });
    if (to) qb.andWhere('a.date <= :to', { to });
    return qb.orderBy('a.date', 'DESC').getMany();
  }
}