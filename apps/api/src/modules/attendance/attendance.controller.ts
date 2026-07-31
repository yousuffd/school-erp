import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Permissions({ module: 'attendance', action: 'create' })
  markAttendance(@Body() dto: MarkAttendanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.markAttendance(dto, user.userId);
  }

  /**
   * Self-service, Parent only — Student is deliberately excluded here, per
   * explicit scope decision (unlike Examinations/Discipline/Diary/
   * Communication, which all include Student). No @Permissions() decorator;
   * the gate is the parentOfStudentIds check below. Declared ABOVE
   * ':studentId'-shaped dynamic routes per this project's static-before-
   * dynamic convention, though 'by-student' is itself already a static
   * segment so there's no actual collision risk here — kept for consistency.
   */
  @Get('my-child-attendance')
  findMyChildAttendance(
    @Query('studentId') studentId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.parentOfStudentIds || user.parentOfStudentIds.length === 0) {
      throw new ForbiddenException('This endpoint is only available to Parent accounts.');
    }
    if (!studentId) {
      throw new BadRequestException('studentId query parameter is required for Parent accounts — specify which child.');
    }
    if (!user.parentOfStudentIds.includes(studentId)) {
      throw new ForbiddenException('This student is not linked to your account.');
    }
    return this.attendanceService.findForStudentAsParent(studentId, from, to);
  }

  @Get('by-class/:schoolClassId')
  @Permissions({ module: 'attendance', action: 'view' })
  findForClassOnDate(
    @Param('schoolClassId') schoolClassId: string,
    @Query('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.findForClassOnDate(user.tenantId, user.userId, schoolClassId, date);
  }

  @Get('by-student/:studentId')
  @Permissions({ module: 'attendance', action: 'view' })
  findForStudent(
    @Param('studentId') studentId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.findForStudent(user.tenantId, user.userId, studentId, from, to);
  }
}