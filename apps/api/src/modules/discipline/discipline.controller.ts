import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CounselingReferralsService } from './counseling-referrals.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { CompleteCorrectiveActionDto } from './dto/complete-corrective-action.dto';
import { CreateCounselingReferralDto } from './dto/create-counseling-referral.dto';
import { UpdateCounselingReferralDto } from './dto/update-counseling-referral.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { resolveParentOnlyStudentId } from '../../common/utils/resolve-parent-only-student-id.util';

/**
 * Single consolidated controller for Discipline & Behaviour Management
 * (Blueprint Part 2, Module 20). Student is deliberately EXCLUDED from
 * this module (unlike Activities/Examinations) — the one self-service
 * route (my-child-incidents) uses resolveParentOnlyStudentId(), NOT
 * resolveSelfServiceStudentId(), specifically because that util's Student
 * branch would silently reopen the access this module intentionally
 * withholds. Declared ABOVE ':id' routes per the project's established
 * static-before-dynamic convention (see Activities' events/my-registrations
 * bug fix, session 30).
 */
@ApiTags('discipline')
@ApiBearerAuth()
@Controller('discipline')
export class DisciplineController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly correctiveActionsService: CorrectiveActionsService,
    private readonly counselingReferralsService: CounselingReferralsService,
  ) {}

  // ---------- Parent self-service (declared above :id routes) ----------

  @Get('incidents/my-child-incidents')
  findMyChildIncidents(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const resolved = resolveParentOnlyStudentId(user, studentId);
    return this.incidentsService.findForStudent(resolved);
  }

  @Get('incidents/my-child-points-balance')
  getMyChildPointsBalance(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const resolved = resolveParentOnlyStudentId(user, studentId);
    return this.incidentsService.getPointsBalance(resolved);
  }

  // ---------- Incidents ----------

  @Post('incidents')
  @Permissions({ module: 'discipline', action: 'create' })
  createIncident(@Body() dto: CreateIncidentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.incidentsService.create(dto, user.userId);
  }

  @Get('incidents')
  @Permissions({ module: 'discipline', action: 'view' })
  findIncidents(@Query('tenantId') tenantId: string, @Query('studentId') studentId?: string) {
    return this.incidentsService.findAllForTenant(tenantId, studentId);
  }

  @Get('incidents/points-balance/:studentId')
  @Permissions({ module: 'discipline', action: 'view' })
  getPointsBalance(@Param('studentId') studentId: string) {
    return this.incidentsService.getPointsBalance(studentId);
  }

  @Get('incidents/:id')
  @Permissions({ module: 'discipline', action: 'view' })
  findIncident(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch('incidents/:id/status')
  @Permissions({ module: 'discipline', action: 'edit' })
  updateIncidentStatus(@Param('id') id: string, @Body() dto: UpdateIncidentStatusDto) {
    return this.incidentsService.updateStatus(id, dto);
  }

  @Delete('incidents/:id')
  @Permissions({ module: 'discipline', action: 'delete' })
  removeIncident(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }

  // ---------- Corrective Actions ----------

  @Post('incidents/:id/corrective-actions')
  @Permissions({ module: 'discipline', action: 'edit' })
  createCorrectiveAction(@Param('id') incidentId: string, @Body() dto: CreateCorrectiveActionDto) {
    return this.correctiveActionsService.create(incidentId, dto);
  }

  @Get('incidents/:id/corrective-actions')
  @Permissions({ module: 'discipline', action: 'view' })
  findCorrectiveActions(@Param('id') incidentId: string) {
    return this.correctiveActionsService.findForIncident(incidentId);
  }

  @Patch('corrective-actions/:id/complete')
  @Permissions({ module: 'discipline', action: 'edit' })
  completeCorrectiveAction(@Param('id') id: string, @Body() dto: CompleteCorrectiveActionDto) {
    return this.correctiveActionsService.complete(id, dto);
  }

  @Delete('corrective-actions/:id')
  @Permissions({ module: 'discipline', action: 'delete' })
  removeCorrectiveAction(@Param('id') id: string) {
    return this.correctiveActionsService.remove(id);
  }

  // ---------- Counseling Referrals ----------

  @Post('incidents/:id/counseling-referrals')
  @Permissions({ module: 'discipline', action: 'edit' })
  createCounselingReferral(@Param('id') incidentId: string, @Body() dto: CreateCounselingReferralDto) {
    return this.counselingReferralsService.create(incidentId, dto);
  }

  @Get('incidents/:id/counseling-referrals')
  @Permissions({ module: 'discipline', action: 'view' })
  findCounselingReferrals(@Param('id') incidentId: string) {
    return this.counselingReferralsService.findForIncident(incidentId);
  }

  @Get('counseling-referrals/my-caseload')
  @Permissions({ module: 'discipline', action: 'view' })
  findMyCaseload(@CurrentUser() user: AuthenticatedUser) {
    return this.counselingReferralsService.findForCounselor(user.userId);
  }

  @Patch('counseling-referrals/:id')
  @Permissions({ module: 'discipline', action: 'edit' })
  updateCounselingReferral(@Param('id') id: string, @Body() dto: UpdateCounselingReferralDto) {
    return this.counselingReferralsService.update(id, dto);
  }

  @Delete('counseling-referrals/:id')
  @Permissions({ module: 'discipline', action: 'delete' })
  removeCounselingReferral(@Param('id') id: string) {
    return this.counselingReferralsService.remove(id);
  }
}
