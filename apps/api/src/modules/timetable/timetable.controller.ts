import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { GenerateTimetableDto } from './dto/generate-timetable.dto';
import { GenerateElectivePeriodsDto } from './dto/generate-elective-periods.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('timetable')
@ApiBearerAuth()
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @Permissions({ module: 'academic-management', action: 'create' })
  create(@Body() dto: CreateTimetableSlotDto) {
    return this.timetableService.create(dto);
  }

  @Post('generate')
  @Permissions({ module: 'academic-management', action: 'create' })
  generate(@Body() dto: GenerateTimetableDto) {
    return this.timetableService.generateSchedule(
      dto.tenant_id,
      dto.requirements,
      dto.days,
      dto.periods_per_day,
    );
  }

  @Post('generate-electives')
  @Permissions({ module: 'academic-management', action: 'create' })
  generateElectives(@Body() dto: GenerateElectivePeriodsDto) {
    return this.timetableService.generateElectivePeriods(dto.tenant_id);
  }

  @Get('my-class-subjects')
  findMyClassSubjects(@CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.findClassSubjectPairsForTeacher(user.tenantId, user.userId);
  }
  /** Suggests a teacher per subject from existing tenant-wide timetable data — see TimetableService.findTeachersBySubject. */
  @Get('teachers-by-subject')
  @Permissions({ module: 'academic-management', action: 'view' })
  findTeachersBySubject(@Query('tenantId') tenantId: string) {
    return this.timetableService.findTeachersBySubject(tenantId);
  }

  @Get('teacher-occupancy')
  @Permissions({ module: 'academic-management', action: 'view' })
  findTeacherOccupancy(@Query('tenantId') tenantId: string) {
    return this.timetableService.findTeacherOccupancy(tenantId);
  }

  @Get('by-class/:schoolClassId')
  @Permissions({ module: 'academic-management', action: 'view' })
  findForClass(@Param('schoolClassId') schoolClassId: string) {
    return this.timetableService.findForClass(schoolClassId);
  }

  @Get('by-teacher')
  @Permissions({ module: 'academic-management', action: 'view' })
  findForTeacher(@Query('tenantId') tenantId: string, @Query('teacherId') teacherId: string) {
    return this.timetableService.findForTeacher(tenantId, teacherId);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissions({ module: 'academic-management', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.timetableService.remove(id);
  }
}