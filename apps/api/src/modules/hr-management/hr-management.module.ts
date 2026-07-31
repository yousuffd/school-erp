import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobOpening } from './entities/job-opening.entity';
import { Applicant } from './entities/applicant.entity';
import { Employee } from './entities/employee.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { StaffAttendanceRecord } from './entities/staff-attendance-record.entity';
import { PerformanceReviewCycle } from './entities/performance-review-cycle.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import { StaffCertification } from './entities/staff-certification.entity';
import { SuccessionPlan } from './entities/succession-plan.entity';
import { JobOpeningsService } from './job-openings.service';
import { ApplicantsService } from './applicants.service';
import { EmployeesService } from './employees.service';
import { LeaveRequestsService } from './leave-requests.service';
import { StaffAttendanceService } from './staff-attendance.service';
import { PerformanceReviewCyclesService } from './performance-review-cycles.service';
import { PerformanceReviewsService } from './performance-reviews.service';
import { StaffCertificationsService } from './staff-certifications.service';
import { SuccessionPlansService } from './succession-plans.service';
import { HrManagementController } from './hr-management.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobOpening,
      Applicant,
      Employee,
      LeaveRequest,
      StaffAttendanceRecord,
      PerformanceReviewCycle,
      PerformanceReview,
      StaffCertification,
      SuccessionPlan,
    ]),
  ],
  controllers: [HrManagementController],
  providers: [
    JobOpeningsService,
    ApplicantsService,
    EmployeesService,
    LeaveRequestsService,
    StaffAttendanceService,
    PerformanceReviewCyclesService,
    PerformanceReviewsService,
    StaffCertificationsService,
    SuccessionPlansService,
  ],
  exports: [
    JobOpeningsService,
    ApplicantsService,
    EmployeesService,
    LeaveRequestsService,
    StaffAttendanceService,
    PerformanceReviewCyclesService,
    PerformanceReviewsService,
    StaffCertificationsService,
    SuccessionPlansService,
  ],
})
export class HrManagementModule {}
