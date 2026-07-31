import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { TimetableService } from '../timetable/timetable.service';
import { Student } from '../students/entities/student.entity';
import { assertTeacherClassAccess } from '../../common/utils/teacher-class-scope.util';
import { assertStudentInTeacherScope } from '../../common/utils/teacher-student-scope.util';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly timetableService: TimetableService,
  ) {}

  private repo(): Repository<AttendanceRecord> {
    return scopedRepo(this.attendanceRepo, AttendanceRecord);
  }

  async markAttendance(dto: MarkAttendanceDto, markedBy: string): Promise<AttendanceRecord[]> {
    await assertTeacherClassAccess(this.timetableService, dto.tenant_id, markedBy, dto.school_class_id);

    const results: AttendanceRecord[] = [];

    for (const entry of dto.entries) {
      let record = await this.repo().findOne({
        where: {
          tenant_id: dto.tenant_id,
          school_class_id: dto.school_class_id,
          student_id: entry.student_id,
          date: dto.date,
        },
      });

      if (record) {
        record.status = entry.status;
        record.notes = entry.notes;
        record.marked_by = markedBy;
      } else {
        record = this.repo().create({
          tenant_id: dto.tenant_id,
          school_class_id: dto.school_class_id,
          student_id: entry.student_id,
          date: dto.date,
          status: entry.status,
          notes: entry.notes,
          marked_by: markedBy,
        });
      }

      results.push(await this.repo().save(record));
    }

    return results;
  }

  async findForClassOnDate(tenantId: string, requestingUserId: string, schoolClassId: string, date: string): Promise<AttendanceRecord[]> {
    await assertTeacherClassAccess(this.timetableService, tenantId, requestingUserId, schoolClassId);
    return this.repo().find({ where: { school_class_id: schoolClassId, date } });
  }

  async findForStudent(tenantId: string, requestingUserId: string, studentId: string, from?: string, to?: string): Promise<AttendanceRecord[]> {
    await assertStudentInTeacherScope(this.timetableService, this.studentRepo, tenantId, requestingUserId, studentId);

    const qb = this.repo()
      .createQueryBuilder('record')
      .where('record.student_id = :studentId', { studentId });
    if (from) qb.andWhere('record.date >= :from', { from });
    if (to) qb.andWhere('record.date <= :to', { to });
    return qb.orderBy('record.date', 'DESC').getMany();
  }

  /**
   * Self-service for Parent — the controller has already verified studentId
   * is genuinely in the caller's parentOfStudentIds, so this just runs the
   * same date-range query as findForStudent without the Teacher-scoping
   * check (which doesn't apply to a Parent caller at all).
   */
  async findForStudentAsParent(studentId: string, from?: string, to?: string): Promise<AttendanceRecord[]> {
    const qb = this.repo()
      .createQueryBuilder('record')
      .where('record.student_id = :studentId', { studentId });
    if (from) qb.andWhere('record.date >= :from', { from });
    if (to) qb.andWhere('record.date <= :to', { to });
    return qb.orderBy('record.date', 'DESC').getMany();
  }
}