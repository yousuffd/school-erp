import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentHealthProfilesService } from './student-health-profiles.service';
import { ImmunizationRecordsService } from './immunization-records.service';
import { ClinicVisitsService } from './clinic-visits.service';
import { MedicationAdministrationsService } from './medication-administrations.service';
import { ScreeningCampaignsService } from './screening-campaigns.service';
import { ScreeningResultsService } from './screening-results.service';
import { UpsertStudentHealthProfileDto } from './dto/upsert-student-health-profile.dto';
import { CreateImmunizationRecordDto } from './dto/create-immunization-record.dto';
import { CreateClinicVisitDto } from './dto/create-clinic-visit.dto';
import { UpdateClinicVisitDto } from './dto/update-clinic-visit.dto';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto';
import { CreateScreeningCampaignDto } from './dto/create-screening-campaign.dto';
import { CreateScreeningResultDto } from './dto/create-screening-result.dto';
import { UpdateScreeningResultDto } from './dto/update-screening-result.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequiresFeature } from '../../common/decorators/feature.decorator';

/**
 * Single consolidated controller for Health & Wellness (Blueprint Part 2,
 * Module 16), same pattern as Transportation — per explicit choice.
 *
 * Every list/single-record read passes user.userId through as an optional
 * teacherId, same as Examinations: the scoping decision is data-driven
 * inside each service (via teacher-student-scope.util.ts), not based on
 * checking a role name here. A caller with no timetable assignments
 * (almost always Admin) sees everything unscoped; a Teacher with
 * assignments is scoped to only their own students' records.
 *
 * Teacher has 'view' only at the permission-decorator level (see
 * phase3-health-wellness-permission-matrix.ts) — no create/edit/delete
 * routes are reachable for that role regardless of scoping.
 */
@ApiTags('health-wellness')
@ApiBearerAuth()
@RequiresFeature('health-wellness')
@Controller('health-wellness')
export class HealthWellnessController {
  constructor(
    private readonly profilesService: StudentHealthProfilesService,
    private readonly immunizationsService: ImmunizationRecordsService,
    private readonly clinicVisitsService: ClinicVisitsService,
    private readonly medicationsService: MedicationAdministrationsService,
    private readonly campaignsService: ScreeningCampaignsService,
    private readonly resultsService: ScreeningResultsService,
  ) {}

  // ---------- Student Health Profiles ----------

  @Post('profiles')
  @Permissions({ module: 'health-wellness', action: 'create' })
  upsertProfile(@Body() dto: UpsertStudentHealthProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.upsert(dto, user.userId);
  }

  @Get('profiles')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findProfiles(@Query('tenantId') tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.findAllForTenant(tenantId, user.userId);
  }

  @Get('profiles/by-student/:studentId')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findProfileForStudent(
    @Param('studentId') studentId: string,
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.profilesService.findByStudent(studentId, tenantId, user.userId);
  }

  // ---------- Immunization Records ----------

  @Post('immunizations')
  @Permissions({ module: 'health-wellness', action: 'create' })
  createImmunization(@Body() dto: CreateImmunizationRecordDto, @CurrentUser() user: AuthenticatedUser) {
    return this.immunizationsService.create(dto, user.userId);
  }

  @Get('immunizations')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findImmunizations(@Query('tenantId') tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.immunizationsService.findAllForTenant(tenantId, user.userId);
  }

  @Get('immunizations/by-student/:studentId')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findImmunizationsForStudent(
    @Param('studentId') studentId: string,
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.immunizationsService.findForStudent(studentId, tenantId, user.userId);
  }

  @Delete('immunizations/:id')
  @Permissions({ module: 'health-wellness', action: 'delete' })
  removeImmunization(@Param('id') id: string) {
    return this.immunizationsService.remove(id);
  }

  // ---------- Clinic Visits ----------

  @Post('clinic-visits')
  @Permissions({ module: 'health-wellness', action: 'create' })
  createClinicVisit(@Body() dto: CreateClinicVisitDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clinicVisitsService.create(dto, user.userId);
  }

  @Get('clinic-visits')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findClinicVisits(
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return this.clinicVisitsService.findAllForTenant(tenantId, user.userId, studentId);
  }

  @Get('clinic-visits/:id')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findClinicVisit(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clinicVisitsService.findOne(id, tenantId, user.userId);
  }

  @Patch('clinic-visits/:id')
  @Permissions({ module: 'health-wellness', action: 'edit' })
  updateClinicVisit(@Param('id') id: string, @Body() dto: UpdateClinicVisitDto) {
    return this.clinicVisitsService.update(id, dto);
  }

  // ---------- Medication Administrations ----------

  @Post('medications')
  @Permissions({ module: 'health-wellness', action: 'create' })
  createMedication(@Body() dto: CreateMedicationAdministrationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.medicationsService.create(dto, user.userId);
  }

  @Get('medications')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findMedications(
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return this.medicationsService.findAllForTenant(tenantId, user.userId, studentId);
  }

  // ---------- Screening Campaigns ----------

  @Post('screening-campaigns')
  @Permissions({ module: 'health-wellness', action: 'create' })
  createCampaign(@Body() dto: CreateScreeningCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Get('screening-campaigns')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findCampaigns(@Query('tenantId') tenantId: string) {
    return this.campaignsService.findAllForTenant(tenantId);
  }

  @Get('screening-campaigns/:id')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findCampaign(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  // ---------- Screening Results ----------

  @Post('screening-results')
  @Permissions({ module: 'health-wellness', action: 'create' })
  createResult(@Body() dto: CreateScreeningResultDto, @CurrentUser() user: AuthenticatedUser) {
    return this.resultsService.create(dto, user.userId);
  }

  @Get('screening-campaigns/:id/results')
  @Permissions({ module: 'health-wellness', action: 'view' })
  findResultsForCampaign(
    @Param('id') campaignId: string,
    @Query('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resultsService.findForCampaign(campaignId, tenantId, user.userId);
  }

  @Patch('screening-results/:id')
  @Permissions({ module: 'health-wellness', action: 'edit' })
  updateResult(@Param('id') id: string, @Body() dto: UpdateScreeningResultDto) {
    return this.resultsService.update(id, dto);
  }
}
