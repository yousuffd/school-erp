import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JobOpeningsService } from './job-openings.service';
import { ApplicantsService } from './applicants.service';
import { EmployeesService } from './employees.service';
import { LeaveRequestsService } from './leave-requests.service';
import { StaffAttendanceService } from './staff-attendance.service';
import { PerformanceReviewCyclesService } from './performance-review-cycles.service';
import { PerformanceReviewsService } from './performance-reviews.service';
import { StaffCertificationsService } from './staff-certifications.service';
import { SuccessionPlansService } from './succession-plans.service';
import { CreateJobOpeningDto } from './dto/create-job-opening.dto';
import { UpdateJobOpeningStatusDto } from './dto/update-job-opening-status.dto';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantStageDto } from './dto/update-applicant-stage.dto';
import { HireApplicantDto } from './dto/hire-applicant.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RecordStaffAttendanceDto } from './dto/record-staff-attendance.dto';
import { CreateReviewCycleDto } from './dto/create-review-cycle.dto';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { CalibrateReviewDto } from './dto/calibrate-review.dto';
import { CreateStaffCertificationDto } from './dto/create-staff-certification.dto';
import { UpdateStaffCertificationDto } from './dto/update-staff-certification.dto';
import { CreateSuccessionPlanDto } from './dto/create-succession-plan.dto';
import { UpdateSuccessionPlanDto } from './dto/update-succession-plan.dto';
import { JobOpening } from './entities/job-opening.entity';
import { LeaveRequestStatus } from './entities/leave-request.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequiresFeature } from '../../common/decorators/feature.decorator';


/**
 * Single consolidated controller for the whole HR Management module
 * (Blueprint Part 2, Module 10) — same pattern as Transportation/Cafeteria/
 * Hostel. Every resource area has its own top-level path segment
 * (job-openings/, applicants/, employees/, leave-requests/, attendance/,
 * review-cycles/, reviews/, certifications/, succession-plans/,
 * policy-documents/), so no route-ordering collisions.
 */
@ApiTags('hr-management')
@ApiBearerAuth()
@Controller('hr-management')
export class HrManagementController {
  constructor(
    private readonly jobOpeningsService: JobOpeningsService,
    private readonly applicantsService: ApplicantsService,
    private readonly employeesService: EmployeesService,
    private readonly leaveRequestsService: LeaveRequestsService,
    private readonly staffAttendanceService: StaffAttendanceService,
    private readonly reviewCyclesService: PerformanceReviewCyclesService,
    private readonly reviewsService: PerformanceReviewsService,
    private readonly certificationsService: StaffCertificationsService,
    private readonly successionPlansService: SuccessionPlansService,
  ) {}

  // ---------- Job Openings ----------

  @Post('job-openings')
  @Permissions({ module: 'hr-management', action: 'create' })
  createJobOpening(@Body() dto: CreateJobOpeningDto) {
    return this.jobOpeningsService.create(dto);
  }

  @Get('job-openings')
  @Permissions({ module: 'hr-management', action: 'view' })
  findJobOpenings(@Query('tenantId') tenantId: string, @Query('status') status?: JobOpening['status']) {
    return this.jobOpeningsService.findAllForTenant(tenantId, status);
  }

  @Get('job-openings/:id')
  @Permissions({ module: 'hr-management', action: 'view' })
  findJobOpening(@Param('id') id: string) {
    return this.jobOpeningsService.findOne(id);
  }

  @Patch('job-openings/:id/status')
  @Permissions({ module: 'hr-management', action: 'edit' })
  updateJobOpeningStatus(@Param('id') id: string, @Body() dto: UpdateJobOpeningStatusDto) {
    return this.jobOpeningsService.updateStatus(id, dto);
  }

  // ---------- Applicants ----------

  @Post('applicants')
  @Permissions({ module: 'hr-management', action: 'create' })
  createApplicant(@Body() dto: CreateApplicantDto) {
    return this.applicantsService.create(dto);
  }

  @Get('applicants')
  @Permissions({ module: 'hr-management', action: 'view' })
  findApplicants(@Query('tenantId') tenantId: string, @Query('jobOpeningId') jobOpeningId?: string) {
    return this.applicantsService.findAllForTenant(tenantId, jobOpeningId);
  }

  @Get('applicants/:id')
  @Permissions({ module: 'hr-management', action: 'view' })
  findApplicant(@Param('id') id: string) {
    return this.applicantsService.findOne(id);
  }

  @Patch('applicants/:id/stage')
  @Permissions({ module: 'hr-management', action: 'edit' })
  updateApplicantStage(@Param('id') id: string, @Body() dto: UpdateApplicantStageDto) {
    return this.applicantsService.updateStage(id, dto);
  }

  @Post('applicants/:id/hire')
  @Permissions({ module: 'hr-management', action: 'approve' })
  hireApplicant(@Param('id') id: string, @Body() dto: HireApplicantDto) {
    return this.applicantsService.hire(id, dto);
  }

  // ---------- Employees ----------

  @Post('employees')
  @Permissions({ module: 'hr-management', action: 'create' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get('employees')
  @Permissions({ module: 'hr-management', action: 'view' })
  findEmployees(@Query('tenantId') tenantId: string, @Query('department') department?: string) {
    return this.employeesService.findAllForTenant(tenantId, department);
  }

  @Get('employees/org-chart')
  @Permissions({ module: 'hr-management', action: 'view' })
  @RequiresFeature('hr-management.succession_planning')
  findOrgChart(@Query('tenantId') tenantId: string) {
    return this.employeesService.findAllWithHierarchy(tenantId);
  }

  /** Self-service — no @Permissions() gate, any authenticated user can look up their own record. */
  @Get('employees/mine')
  findMyEmployeeRecord(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findByUserId(user.userId);
  }

  @Get('employees/:id')
  @Permissions({ module: 'hr-management', action: 'view' })
  findEmployee(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch('employees/:id')
  @Permissions({ module: 'hr-management', action: 'edit' })
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  // ---------- Leave Requests ----------

  @Post('leave-requests')
  @Permissions({ module: 'hr-management', action: 'create' })
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveRequestsService.create(dto);
  }

  @Get('leave-requests')
  @Permissions({ module: 'hr-management', action: 'view' })
  findLeaveRequests(
    @Query('tenantId') tenantId: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: LeaveRequestStatus,
  ) {
    return this.leaveRequestsService.findAllForTenant(tenantId, { employeeId, status });
  }

  /** Self-service — no @Permissions() gate. */
  @Get('leave-requests/mine')
  async findMyLeaveRequests(@CurrentUser() user: AuthenticatedUser) {
    const employee = await this.employeesService.findByUserId(user.userId);
    if (!employee) return [];
    return this.leaveRequestsService.findForEmployee(employee.id);
  }

  @Patch('leave-requests/:id/approve')
  @Permissions({ module: 'hr-management', action: 'approve' })
  approveLeaveRequest(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveRequestsService.decide(id, LeaveRequestStatus.APPROVED, user.userId);
  }

  @Patch('leave-requests/:id/reject')
  @Permissions({ module: 'hr-management', action: 'approve' })
  rejectLeaveRequest(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveRequestsService.decide(id, LeaveRequestStatus.REJECTED, user.userId);
  }

  // ---------- Staff Attendance ----------

  @Post('attendance')
  @Permissions({ module: 'hr-management', action: 'create' })
  recordAttendance(@Body() dto: RecordStaffAttendanceDto) {
    return this.staffAttendanceService.recordBulk(dto);
  }

  @Get('attendance/by-date')
  @Permissions({ module: 'hr-management', action: 'view' })
  findAttendanceForDate(@Query('tenantId') tenantId: string, @Query('date') date: string) {
    return this.staffAttendanceService.findForDate(tenantId, date);
  }

  @Get('attendance/by-employee/:employeeId')
  @Permissions({ module: 'hr-management', action: 'view' })
  findAttendanceForEmployee(
    @Param('employeeId') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.staffAttendanceService.findForEmployee(employeeId, from, to);
  }

  // ---------- Performance Review Cycles ----------

  @Post('review-cycles')
  @Permissions({ module: 'hr-management', action: 'create' })
  createReviewCycle(@Body() dto: CreateReviewCycleDto) {
    return this.reviewCyclesService.create(dto);
  }

  @Get('review-cycles')
  @Permissions({ module: 'hr-management', action: 'view' })
  findReviewCycles(@Query('tenantId') tenantId: string) {
    return this.reviewCyclesService.findAllForTenant(tenantId);
  }

  @Get('review-cycles/:id')
  @Permissions({ module: 'hr-management', action: 'view' })
  findReviewCycle(@Param('id') id: string) {
    return this.reviewCyclesService.findOne(id);
  }

  @Patch('review-cycles/:id/start-calibration')
  @Permissions({ module: 'hr-management', action: 'approve' })
  @RequiresFeature('hr-management.performance_calibration')
  startCalibration(@Param('id') id: string) {
    return this.reviewCyclesService.startCalibration(id);
  }

  @Patch('review-cycles/:id/close')
  @Permissions({ module: 'hr-management', action: 'approve' })
  closeReviewCycle(@Param('id') id: string) {
    return this.reviewCyclesService.close(id);
  }

  // ---------- Performance Reviews ----------

  @Post('reviews')
  @Permissions({ module: 'hr-management', action: 'create' })
  createReview(@Body() dto: CreatePerformanceReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get('reviews/by-cycle/:cycleId')
  @Permissions({ module: 'hr-management', action: 'view' })
  findReviewsForCycle(@Param('cycleId') cycleId: string) {
    return this.reviewsService.findForCycle(cycleId);
  }

  @Get('reviews/by-employee/:employeeId')
  @Permissions({ module: 'hr-management', action: 'view' })
  findReviewsForEmployee(@Param('employeeId') employeeId: string) {
    return this.reviewsService.findForEmployee(employeeId);
  }

  /** Self-service — same employeeId-from-JWT pattern as leave-requests/mine, not client-supplied. */
  @Get('reviews/mine')
  async findMyReviews(@CurrentUser() user: AuthenticatedUser) {
    const employee = await this.employeesService.findByUserId(user.userId);
    if (!employee) return [];
    return this.reviewsService.findForEmployee(employee.id);
  }

  @Patch('reviews/:id/calibrate')
  @Permissions({ module: 'hr-management', action: 'approve' })
  @RequiresFeature('hr-management.performance_calibration')
  calibrateReview(@Param('id') id: string, @Body() dto: CalibrateReviewDto) {
    return this.reviewsService.calibrate(id, dto);
  }

  // ---------- Staff Certifications ----------

  @Post('certifications')
  @Permissions({ module: 'hr-management', action: 'create' })
  createCertification(@Body() dto: CreateStaffCertificationDto) {
    return this.certificationsService.create(dto);
  }

  @Get('certifications')
  @Permissions({ module: 'hr-management', action: 'view' })
  findCertifications(@Query('tenantId') tenantId: string, @Query('employeeId') employeeId?: string) {
    return this.certificationsService.findAllForTenant(tenantId, employeeId);
  }

  @Get('certifications/expiring-soon')
  @Permissions({ module: 'hr-management', action: 'view' })
  findExpiringSoon(@Query('tenantId') tenantId: string, @Query('daysAhead') daysAhead?: string) {
    return this.certificationsService.findExpiringSoon(tenantId, daysAhead ? Number(daysAhead) : undefined);
  }

  @Patch('certifications/:id')
  @Permissions({ module: 'hr-management', action: 'edit' })
  updateCertification(@Param('id') id: string, @Body() dto: UpdateStaffCertificationDto) {
    return this.certificationsService.update(id, dto);
  }

  @Delete('certifications/:id')
  @Permissions({ module: 'hr-management', action: 'delete' })
  removeCertification(@Param('id') id: string) {
    return this.certificationsService.remove(id);
  }

  // ---------- Succession Plans ----------

  @Post('succession-plans')
  @Permissions({ module: 'hr-management', action: 'create' })
  @RequiresFeature('hr-management.succession_planning')
  createSuccessionPlan(@Body() dto: CreateSuccessionPlanDto) {
    return this.successionPlansService.create(dto);
  }

  @Get('succession-plans')
  @Permissions({ module: 'hr-management', action: 'view' })
  @RequiresFeature('hr-management.succession_planning')
  findSuccessionPlans(@Query('tenantId') tenantId: string) {
    return this.successionPlansService.findAllForTenant(tenantId);
  }

  @Patch('succession-plans/:id')
  @Permissions({ module: 'hr-management', action: 'edit' })
  @RequiresFeature('hr-management.succession_planning')
  updateSuccessionPlan(@Param('id') id: string, @Body() dto: UpdateSuccessionPlanDto) {
    return this.successionPlansService.update(id, dto);
  }

  @Delete('succession-plans/:id')
  @Permissions({ module: 'hr-management', action: 'delete' })
  @RequiresFeature('hr-management.succession_planning')
  removeSuccessionPlan(@Param('id') id: string) {
    return this.successionPlansService.remove(id);
  }

}
