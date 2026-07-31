import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlumniProfilesService } from './alumni-profiles.service';
import { AlumniEventsService } from './alumni-events.service';
import { DonationsService } from './donations.service';
import { MentorshipMatchesService } from './mentorship-matches.service';
import { CreateAlumniProfileDto } from './dto/create-alumni-profile.dto';
import { UpdateAlumniProfileDto } from './dto/update-alumni-profile.dto';
import { CreateAlumniEventDto } from './dto/create-alumni-event.dto';
import { RegisterForAlumniEventDto } from './dto/register-for-alumni-event.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreateMentorshipMatchDto } from './dto/create-mentorship-match.dto';
import { UpdateMentorshipMatchStatusDto } from './dto/update-mentorship-match-status.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Single consolidated controller for Alumni & Advancement (Blueprint
 * Part 2, Module 23). No new role — reuses existing roles per explicit
 * decision. No self-service — admin/officer-managed only, no alumnus
 * login access to any of these routes (explicit decision, unlike every
 * other Phase 5 module built this session).
 */
@ApiTags('alumni')
@ApiBearerAuth()
@Controller('alumni')
export class AlumniController {
  constructor(
    private readonly profilesService: AlumniProfilesService,
    private readonly eventsService: AlumniEventsService,
    private readonly donationsService: DonationsService,
    private readonly mentorshipMatchesService: MentorshipMatchesService,
  ) {}

  // ---------- Profiles ----------

  @Post('profiles')
  @Permissions({ module: 'alumni', action: 'create' })
  createProfile(@Body() dto: CreateAlumniProfileDto) {
    return this.profilesService.create(dto);
  }

  @Get('profiles')
  @Permissions({ module: 'alumni', action: 'view' })
  findProfiles(@Query('tenantId') tenantId: string) {
    return this.profilesService.findAllForTenant(tenantId);
  }

  @Get('profiles/:id')
  @Permissions({ module: 'alumni', action: 'view' })
  findProfile(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch('profiles/:id')
  @Permissions({ module: 'alumni', action: 'edit' })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateAlumniProfileDto) {
    return this.profilesService.update(id, dto);
  }

  @Delete('profiles/:id')
  @Permissions({ module: 'alumni', action: 'delete' })
  removeProfile(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }

  // ---------- Events ----------

  @Post('events')
  @Permissions({ module: 'alumni', action: 'create' })
  createEvent(@Body() dto: CreateAlumniEventDto) {
    return this.eventsService.create(dto);
  }

  @Get('events')
  @Permissions({ module: 'alumni', action: 'view' })
  findEvents(@Query('tenantId') tenantId: string) {
    return this.eventsService.findAllForTenant(tenantId);
  }

  @Delete('events/:id')
  @Permissions({ module: 'alumni', action: 'delete' })
  removeEvent(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post('events/:id/register')
  @Permissions({ module: 'alumni', action: 'edit' })
  registerForEvent(@Param('id') eventId: string, @Body() dto: RegisterForAlumniEventDto) {
    return this.eventsService.register(eventId, dto);
  }

  @Get('events/:id/registrations')
  @Permissions({ module: 'alumni', action: 'view' })
  findEventRegistrations(@Param('id') eventId: string) {
    return this.eventsService.findRegistrations(eventId);
  }

  // ---------- Donations ----------

  @Post('donations')
  @Permissions({ module: 'alumni', action: 'create' })
  createDonation(@Body() dto: CreateDonationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.donationsService.create(dto, user.userId);
  }

  @Get('donations')
  @Permissions({ module: 'alumni', action: 'view' })
  findDonations(@Query('tenantId') tenantId: string, @Query('alumniId') alumniId?: string) {
    return this.donationsService.findAllForTenant(tenantId, alumniId);
  }

  @Get('donations/total/:alumniId')
  @Permissions({ module: 'alumni', action: 'view' })
  getDonationTotal(@Param('alumniId') alumniId: string) {
    return this.donationsService.getTotalForAlumnus(alumniId);
  }

  @Delete('donations/:id')
  @Permissions({ module: 'alumni', action: 'delete' })
  removeDonation(@Param('id') id: string) {
    return this.donationsService.remove(id);
  }

  // ---------- Mentorship Matches ----------

  @Post('mentorship-matches')
  @Permissions({ module: 'alumni', action: 'create' })
  createMentorshipMatch(@Body() dto: CreateMentorshipMatchDto) {
    return this.mentorshipMatchesService.create(dto);
  }

  @Get('mentorship-matches')
  @Permissions({ module: 'alumni', action: 'view' })
  findMentorshipMatches(@Query('tenantId') tenantId: string) {
    return this.mentorshipMatchesService.findAllForTenant(tenantId);
  }

  @Patch('mentorship-matches/:id/status')
  @Permissions({ module: 'alumni', action: 'edit' })
  updateMentorshipMatchStatus(@Param('id') id: string, @Body() dto: UpdateMentorshipMatchStatusDto) {
    return this.mentorshipMatchesService.updateStatus(id, dto);
  }

  @Delete('mentorship-matches/:id')
  @Permissions({ module: 'alumni', action: 'delete' })
  removeMentorshipMatch(@Param('id') id: string) {
    return this.mentorshipMatchesService.remove(id);
  }
}
