import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { EnterMarksDto } from './dto/enter-marks.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('exams')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Permissions({ module: 'examinations', action: 'create' })
  create(@Body() dto: CreateExamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.create(dto, user.userId);
  }

  @Get()
  @Permissions({ module: 'examinations', action: 'view' })
  findAllForTenant(
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('schoolClassId') schoolClassId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    // Passing user.userId unconditionally, for everyone — the scoping
    // decision (narrow vs. leave unscoped) happens data-driven inside the
    // service based on TimetableSlot.teacher_id assignments, not on
    // checking a role name here.
    return this.examsService.findAllForTenant(tenantId, { schoolClassId, subjectId }, user.userId);
  }

  /**
   * Self-service, now serving BOTH Student and Parent callers — never
   * takes a trusted studentId from a Student caller, only from a Parent
   * caller, and even then only after checking it against
   * user.parentOfStudentIds (populated at login from ParentStudentLink;
   * see JwtPayload's doc comment for the "stale until re-login" caveat).
   * No @Permissions() decorator (neither role has any examinations
   * permission by design and should stay that way); the gate is the
   * explicit studentId/parentOfStudentIds checks below.
   *
   * Student branch: a Student caller's OWN studentId always wins — any
   * studentId query param they send is silently ignored rather than
   * trusted, closing the obvious spoofing attempt (a Student trying to
   * view a classmate's results by passing a different id).
   *
   * Parent branch: studentId is REQUIRED (a Parent can have multiple
   * children, so there's no single implicit "own" record the way there is
   * for a Student), and must appear in user.parentOfStudentIds or the
   * request is rejected.
   *
   * Declared ABOVE the ':id' route below so Nest doesn't swallow this path
   * as an :id param.
   */
  @Get('my-results')
  findMyResults(
    @Query('academicYearId') academicYearId: string,
    @Query('studentId') studentId: string | undefined,
    @Query('examName') examName: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.studentId) {
      return this.examsService.findResultsForStudent(user.studentId, academicYearId, examName);
    }

    if (user.parentOfStudentIds && user.parentOfStudentIds.length > 0) {
      if (!studentId) {
        throw new BadRequestException(
          'studentId query parameter is required for Parent accounts — specify which child.',
        );
      }
      if (!user.parentOfStudentIds.includes(studentId)) {
        throw new ForbiddenException('This student is not linked to your account.');
      }
      return this.examsService.findResultsForStudent(studentId, academicYearId, examName);
    }

    throw new ForbiddenException('This endpoint is only available to Student or Parent accounts.');
  }

  @Get(':id')
  @Permissions({ module: 'examinations', action: 'view' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.findOne(id, user.userId);
  }

  @Post('marks')
  @Permissions({ module: 'examinations', action: 'edit' })
  enterMarks(@Body() dto: EnterMarksDto, @CurrentUser() user: AuthenticatedUser) {
    // Ownership check happens inside enterMarks itself (via findOne) — no
    // extra work needed here, same user.userId already being passed.
    return this.examsService.enterMarks(dto, user.userId);
  }

  @Get(':id/results')
  @Permissions({ module: 'examinations', action: 'view' })
  findResultsForExam(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.findResultsForExam(id, user.userId);
  }
}