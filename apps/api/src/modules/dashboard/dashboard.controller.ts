import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Gated on core-admin:view — the same permission School Admin already
   * holds (confirmed in their seeded role) — since this is the
   * Principal/Management summary, and School Admin is who actually logs in
   * to see it in this app's role model (see PRINCIPAL_DASHBOARD_SCOPE
   * discussion — there's no separate "Principal" role, School Admin fills
   * that seat).
   */
  @Get('principal-summary')
  @Permissions({ module: 'core-admin', action: 'view' })
  getPrincipalSummary() {
    return this.dashboardService.getPrincipalSummary();
  }

  @Get('attendance-trend')
  @Permissions({ module: 'core-admin', action: 'view' })
  getAttendanceTrend() {
    return this.dashboardService.getAttendanceTrend();
  }

  @Get('exam-performance')
  @Permissions({ module: 'core-admin', action: 'view' })
  getExamPerformance() {
    return this.dashboardService.getExamPerformance();
  }

  @Get('fee-defaulters')
  @Permissions({ module: 'core-admin', action: 'view' })
  getFeeDefaulters(@Query('classId') classId?: string) {
    return this.dashboardService.getFeeDefaulters(classId);
  }

  @Get('academic-performers')
  @Permissions({ module: 'core-admin', action: 'view' })
  getAcademicPerformers(@Query('classId') classId?: string) {
    return this.dashboardService.getAcademicPerformers(classId);
  }

  @Get('student-attendance-exceptions')
  @Permissions({ module: 'core-admin', action: 'view' })
  getStudentAttendanceExceptions(@Query('classId') classId?: string) {
    return this.dashboardService.getStudentAttendanceExceptions(classId);
  }

  @Get('staff-attendance-exceptions')
  @Permissions({ module: 'core-admin', action: 'view' })
  getStaffAttendanceExceptions(@Query('department') department?: string) {
    return this.dashboardService.getStaffAttendanceExceptions(department);
  }
}