import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealAttendanceRecord } from './entities/meal-attendance-record.entity';
import { MealType } from './entities/daily-menu.entity';
import { RecordMealAttendanceDto } from './dto/record-meal-attendance.dto';
import { scopedRepo } from '../../common/context/tenant-context';

export interface MealHeadcount {
  attendance_date: string;
  meal_type: MealType;
  count: number;
}

@Injectable()
export class MealAttendanceService {
  constructor(
    @InjectRepository(MealAttendanceRecord) private readonly attendanceRepo: Repository<MealAttendanceRecord>,
  ) {}

  private repo(): Repository<MealAttendanceRecord> {
    return scopedRepo(this.attendanceRepo, MealAttendanceRecord);
  }

  /**
   * Bulk-records presence for a whole roster at once — same pattern as
   * Attendance's markAttendance. Idempotent per student: re-marking a
   * student already recorded for this date+meal is silently skipped
   * (existence-checked), not an error — matches the "resubmitting the
   * same headcount list twice shouldn't fail" expectation of a real
   * cafeteria workflow.
   */
  async recordBulk(dto: RecordMealAttendanceDto, recordedBy: string): Promise<MealAttendanceRecord[]> {
    const existing = await this.repo().find({
      where: { tenant_id: dto.tenant_id, attendance_date: dto.attendance_date, meal_type: dto.meal_type },
    });
    const alreadyRecorded = new Set(existing.map((r) => r.student_id));

    const toCreate = dto.student_ids
      .filter((id) => !alreadyRecorded.has(id))
      .map((studentId) =>
        this.repo().create({
          tenant_id: dto.tenant_id,
          student_id: studentId,
          attendance_date: dto.attendance_date,
          meal_type: dto.meal_type,
          recorded_by: recordedBy,
        }),
      );

    const created = toCreate.length ? await this.repo().save(toCreate) : [];
    return [...existing, ...created];
  }

  findForDate(tenantId: string, date: string, mealType?: MealType): Promise<MealAttendanceRecord[]> {
    const where: Record<string, string> = { tenant_id: tenantId, attendance_date: date };
    if (mealType) where.meal_type = mealType;
    return this.repo().find({ where });
  }

  /**
   * Uses to_char() to force attendance_date to come back as a plain
   * "YYYY-MM-DD" string, not a JS Date object. Without this cast, the
   * underlying pg driver's default type parser for DATE columns kicks in
   * on raw/getRawMany() queries (unlike normal find()/save() calls, which
   * TypeORM correctly maps to plain strings via column metadata) — the
   * Date object then serializes to JSON as a full UTC timestamp, shifting
   * the date backward by up to a day depending on server timezone (e.g.
   * "2026-07-10" silently became "2026-07-09T18:30:00.000Z" in IST).
   */
  async getHeadcounts(tenantId: string, dateFrom: string, dateTo: string): Promise<MealHeadcount[]> {
    const rows = await this.repo()
      .createQueryBuilder('r')
      .select("to_char(r.attendance_date, 'YYYY-MM-DD')", 'attendance_date')
      .addSelect('r.meal_type', 'meal_type')
      .addSelect('COUNT(*)', 'count')
      .where('r.tenant_id = :tenantId', { tenantId })
      .andWhere('r.attendance_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('r.attendance_date')
      .addGroupBy('r.meal_type')
      .orderBy('r.attendance_date', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      attendance_date: r.attendance_date,
      meal_type: r.meal_type,
      count: parseInt(r.count, 10),
    }));
  }
}
