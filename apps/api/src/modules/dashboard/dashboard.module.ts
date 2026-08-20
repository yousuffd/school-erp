import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { ExamResult } from '../examinations/entities/exam-result.entity';
import { FeeAssignment } from '../fees/entities/fee-assignment.entity';
import { StaffAttendanceRecord } from '../hr-management/entities/staff-attendance-record.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, ExamResult, FeeAssignment, StaffAttendanceRecord])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}