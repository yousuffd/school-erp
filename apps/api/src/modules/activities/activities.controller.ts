import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { EventsService } from './events.service';
import { AwardsService } from './awards.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AddToRosterDto } from './dto/add-to-roster.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { RecordFixtureResultDto } from './dto/record-fixture-result.dto';
import { RegisterForEventDto } from './dto/register-for-event.dto';
import { CreateAwardDto } from './dto/create-award.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { resolveSelfServiceStudentId } from '../../common/utils/resolve-self-service-student-id.util';

/**
 * Single consolidated controller for Activities, Events & Sports
 * (Blueprint Part 2, Module 21) — same pattern as Cafeteria/Transportation/
 * Health & Wellness/Inventory & Assets. Staff routes are @Permissions-gated
 * on the 'activities' module; the three 'my-*' self-service routes below
 * use resolveSelfServiceStudentId() instead, matching Examinations'
 * my-results precedent, and are declared ABOVE any ':id' routes in each
 * resource area so Nest doesn't swallow 'my-roster' etc. as an :id param.
 */
@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly eventsService: EventsService,
    private readonly awardsService: AwardsService,
  ) {}

  // ---------- Activities (clubs/teams catalog) ----------

  @Post()
  @Permissions({ module: 'activities', action: 'create' })
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  @Permissions({ module: 'activities', action: 'view' })
  findAll(@Query('tenantId') tenantId: string) {
    return this.activitiesService.findAllForTenant(tenantId);
  }

  @Patch(':id')
  @Permissions({ module: 'activities', action: 'edit' })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'activities', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  // ---------- Roster ----------

  @Get('my-roster')
  findMyRoster(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const resolved = resolveSelfServiceStudentId(user, studentId);
    return this.activitiesService.findRosterForStudent(resolved);
  }

  @Post(':id/roster')
  @Permissions({ module: 'activities', action: 'edit' })
  addToRoster(@Param('id') activityId: string, @Body() dto: AddToRosterDto) {
    return this.activitiesService.addToRoster(activityId, dto);
  }

  @Get(':id/roster')
  @Permissions({ module: 'activities', action: 'view' })
  findRoster(@Param('id') activityId: string) {
    return this.activitiesService.findRoster(activityId);
  }

  @Delete('roster/:id')
  @Permissions({ module: 'activities', action: 'edit' })
  removeFromRoster(@Param('id') id: string) {
    return this.activitiesService.removeFromRoster(id);
  }

  // ---------- Events ----------

  @Post('events')
  @Permissions({ module: 'activities', action: 'create' })
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get('events')
  @Permissions({ module: 'activities', action: 'view' })
  findEvents(
    @Query('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.eventsService.findAllForTenant(tenantId, dateFrom, dateTo);
  }

  // ---------- Event Registrations (declared ABOVE events/:id — same
  // "static route before dynamic param" precedent as Examinations'
  // my-results — otherwise GET events/:id would swallow this path with
  // id='my-registrations' before it ever reaches this handler) ----------

  @Get('events/my-registrations')
  findMyRegistrations(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const resolved = resolveSelfServiceStudentId(user, studentId);
    return this.eventsService.findRegistrationsForStudent(resolved);
  }

  @Get('events/:id')
  @Permissions({ module: 'activities', action: 'view' })
  findEvent(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Delete('events/:id')
  @Permissions({ module: 'activities', action: 'delete' })
  removeEvent(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Patch('events/:id/fixture-result')
  @Permissions({ module: 'activities', action: 'edit' })
  recordFixtureResult(@Param('id') id: string, @Body() dto: RecordFixtureResultDto) {
    return this.eventsService.recordFixtureResult(id, dto);
  }

  @Post('events/:id/register')
  registerForEvent(
    @Param('id') eventId: string,
    @Body() dto: RegisterForEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Self-service registration: a Student/Parent registers themselves/their
    // child — dto.student_id is validated against the caller exactly like
    // the my-registrations read above, not trusted blindly. Staff with
    // 'activities:create' can also register any student (e.g. a coach
    // signing up their team).
    const hasStaffAccess = (user.permissions ?? []).some(
      (p) => p.module === 'activities' && p.action === 'create',
    );
    if (!hasStaffAccess) {
      const resolved = resolveSelfServiceStudentId(user, dto.student_id);
      dto.student_id = resolved;
    }
    return this.eventsService.register(eventId, dto);
  }

  @Get('events/:id/registrations')
  @Permissions({ module: 'activities', action: 'view' })
  findRegistrations(@Param('id') eventId: string) {
    return this.eventsService.findRegistrations(eventId);
  }

  @Delete('registrations/:id')
  @Permissions({ module: 'activities', action: 'edit' })
  unregister(@Param('id') id: string) {
    return this.eventsService.unregister(id);
  }

  // ---------- Awards ----------

  @Post('awards')
  @Permissions({ module: 'activities', action: 'create' })
  createAward(@Body() dto: CreateAwardDto, @CurrentUser() user: AuthenticatedUser) {
    return this.awardsService.create(dto, user.userId);
  }

  @Get('awards/my-awards')
  findMyAwards(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const resolved = resolveSelfServiceStudentId(user, studentId);
    return this.awardsService.findForStudent(resolved);
  }

  @Get('awards')
  @Permissions({ module: 'activities', action: 'view' })
  findAwards(@Query('tenantId') tenantId: string, @Query('studentId') studentId?: string) {
    return this.awardsService.findAllForTenant(tenantId, studentId);
  }

  @Delete('awards/:id')
  @Permissions({ module: 'activities', action: 'delete' })
  removeAward(@Param('id') id: string) {
    return this.awardsService.remove(id);
  }
}
