import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { RoomAllocationsService } from './room-allocations.service';
import { HostelVisitorsService } from './hostel-visitors.service';
import { MaintenanceRequestsService } from './maintenance-requests.service';
import { HostelAttendanceService } from './hostel-attendance.service';
import { RoomPreferencesService } from './room-preferences.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomAllocationDto } from './dto/create-room-allocation.dto';
import { CreateHostelVisitorDto } from './dto/create-hostel-visitor.dto';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { RecordHostelAttendanceDto } from './dto/record-hostel-attendance.dto';
import { CreateRoomPreferenceDto } from './dto/create-room-preference.dto';
import { MaintenanceRequestStatus } from './entities/maintenance-request.entity';
import { RoomAllocationStatus } from './entities/room-allocation.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequiresFeature } from '../../common/decorators/feature.decorator';

@ApiTags('hostel')
@ApiBearerAuth()
@RequiresFeature('hostel')
@Controller('hostel')
export class HostelController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly allocationsService: RoomAllocationsService,
    private readonly visitorsService: HostelVisitorsService,
    private readonly maintenanceService: MaintenanceRequestsService,
    private readonly attendanceService: HostelAttendanceService,
    private readonly preferencesService: RoomPreferencesService,
  ) {}

  // ---------- Rooms ----------
  @Post('rooms')
  @Permissions({ module: 'hostel', action: 'create' })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get('rooms')
  @Permissions({ module: 'hostel', action: 'view' })
  findRooms(@Query('tenantId') tenantId: string, @Query('campusId') campusId?: string) {
    return this.roomsService.findAllForTenant(tenantId, campusId);
  }

  @Get('rooms/:id')
  @Permissions({ module: 'hostel', action: 'view' })
  findRoom(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch('rooms/:id')
  @Permissions({ module: 'hostel', action: 'edit' })
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete('rooms/:id')
  @Permissions({ module: 'hostel', action: 'delete' })
  removeRoom(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  // ---------- Room Allocations ----------
  @Post('room-allocations')
  @Permissions({ module: 'hostel', action: 'create' })
  createAllocation(@Body() dto: CreateRoomAllocationDto) {
    return this.allocationsService.create(dto);
  }

  @Get('room-allocations')
  @Permissions({ module: 'hostel', action: 'view' })
  findAllocations(
    @Query('tenantId') tenantId: string,
    @Query('roomId') roomId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: RoomAllocationStatus,
  ) {
    return this.allocationsService.findAllForTenant(tenantId, { roomId, studentId, status });
  }

  @Patch('room-allocations/:id/vacate')
  @Permissions({ module: 'hostel', action: 'edit' })
  vacateAllocation(@Param('id') id: string, @Body('vacated_date') vacatedDate: string) {
    return this.allocationsService.vacate(id, vacatedDate);
  }

  // ---------- Visitors ----------
  @Post('visitors')
  @Permissions({ module: 'hostel', action: 'create' })
  createVisitor(@Body() dto: CreateHostelVisitorDto) {
    return this.visitorsService.create(dto);
  }

  @Get('visitors')
  @Permissions({ module: 'hostel', action: 'view' })
  findVisitors(@Query('tenantId') tenantId: string, @Query('studentId') studentId?: string) {
    return this.visitorsService.findAllForTenant(tenantId, studentId);
  }

  @Patch('visitors/:id/check-out')
  @Permissions({ module: 'hostel', action: 'edit' })
  checkOutVisitor(@Param('id') id: string, @Body('check_out_time') checkOutTime: string) {
    return this.visitorsService.checkOut(id, checkOutTime);
  }

  @Patch('visitors/:id/verify')
  @Permissions({ module: 'hostel', action: 'edit' })
  verifyVisitor(@Param('id') id: string) {
    return this.visitorsService.verify(id);
  }

  // ---------- Maintenance Requests ----------
  @Post('maintenance-requests')
  @Permissions({ module: 'hostel', action: 'create' })
  createMaintenanceRequest(@Body() dto: CreateMaintenanceRequestDto) {
    return this.maintenanceService.create(dto);
  }

  @Get('maintenance-requests')
  @Permissions({ module: 'hostel', action: 'view' })
  findMaintenanceRequests(@Query('tenantId') tenantId: string, @Query('status') status?: MaintenanceRequestStatus) {
    return this.maintenanceService.findAllForTenant(tenantId, status);
  }

  @Patch('maintenance-requests/:id/status')
  @Permissions({ module: 'hostel', action: 'edit' })
  updateMaintenanceStatus(
    @Param('id') id: string,
    @Body('status') status: MaintenanceRequestStatus,
    @Body('resolved_date') resolvedDate?: string,
  ) {
    return this.maintenanceService.updateStatus(id, status, resolvedDate);
  }

  // ---------- Attendance ----------
  @Post('attendance')
  @Permissions({ module: 'hostel', action: 'create' })
  recordAttendance(@Body() dto: RecordHostelAttendanceDto) {
    return this.attendanceService.recordBulk(dto);
  }

  @Get('attendance/by-date')
  @Permissions({ module: 'hostel', action: 'view' })
  findAttendanceForDate(@Query('tenantId') tenantId: string, @Query('date') date: string) {
    return this.attendanceService.findForDate(tenantId, date);
  }

  @Get('attendance/by-student/:studentId')
  @Permissions({ module: 'hostel', action: 'view' })
  findAttendanceForStudent(
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.findForStudent(studentId, from, to);
  }

  // ---------- Room Preferences (Advanced — roommate matching) ----------
  @Post('room-preferences')
  @Permissions({ module: 'hostel', action: 'create' })
  @RequiresFeature('hostel.room_preferences')
  createPreference(@Body() dto: CreateRoomPreferenceDto) {
    return this.preferencesService.create(dto);
  }

  @Get('room-preferences')
  @Permissions({ module: 'hostel', action: 'view' })
  @RequiresFeature('hostel.room_preferences')
  findPreferences(@Query('tenantId') tenantId: string) {
    return this.preferencesService.findAllForTenant(tenantId);
  }

  @Post('room-preferences/match')
  @Permissions({ module: 'hostel', action: 'approve' })
  @RequiresFeature('hostel.room_preferences')
  runMatching(@Body('tenant_id') tenantId: string) {
    return this.preferencesService.runMatching(tenantId);
  }
}