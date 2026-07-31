import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { DriversService } from './drivers.service';
import { RoutesService } from './routes.service';
import { RouteAssignmentsService } from './route-assignments.service';
import { StudentTransportAssignmentsService } from './student-transport-assignments.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { CreateRouteAssignmentDto } from './dto/create-route-assignment.dto';
import { CreateStudentTransportAssignmentDto } from './dto/create-student-transport-assignment.dto';
import { UpdateStudentTransportAssignmentDto } from './dto/update-student-transport-assignment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { VehicleMaintenanceService } from './vehicle-maintenance.service';
import { CreateVehicleMaintenanceRecordDto } from './dto/create-vehicle-maintenance-record.dto';
import { StudentTransportOptOutsService } from './student-transport-opt-outs.service';
import { CreateStudentTransportOptOutDto } from './dto/create-student-transport-opt-out.dto';
import { resolveParentOnlyStudentId } from '../../common/utils/resolve-parent-only-student-id.util';

/**
 * Single consolidated controller for the whole Transportation module
 * (Blueprint Part 2, Module 13) — vehicles, drivers, routes+stops, route
 * assignment, and student transport assignment all live here rather than
 * one controller per entity (Library's Books/Issues/Reservations split),
 * per explicit choice this session. Services stay separated by area
 * (mirrors Library's BooksService handling both Book+BookCopy together)
 * — only the HTTP surface is consolidated, not the business logic.
 *
 * Route ordering note: every resource area has its own top-level path
 * segment (vehicles/, drivers/, routes/, stops/, route-assignments/,
 * student-assignments/), so there is no risk of one area's ':id' route
 * swallowing another area's literal path the way 'my-results' vs ':id'
 * required careful ordering within a single resource in Examinations.
 */
@ApiTags('transportation')
@ApiBearerAuth()
@Controller('transportation')
export class TransportationController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly driversService: DriversService,
    private readonly routesService: RoutesService,
    private readonly routeAssignmentsService: RouteAssignmentsService,
    private readonly studentAssignmentsService: StudentTransportAssignmentsService,
    private readonly vehicleMaintenanceService: VehicleMaintenanceService,
    private readonly optOutsService: StudentTransportOptOutsService,
  ) {}
  // ---------- Vehicles ----------

  @Post('vehicles')
  @Permissions({ module: 'transportation', action: 'create' })
  createVehicle(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get('vehicles')
  @Permissions({ module: 'transportation', action: 'view' })
  findVehicles(@Query('tenantId') tenantId: string) {
    return this.vehiclesService.findAllForTenant(tenantId);
  }

  @Get('vehicles/:id')
  @Permissions({ module: 'transportation', action: 'view' })
  findVehicle(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch('vehicles/:id')
  @Permissions({ module: 'transportation', action: 'edit' })
  updateVehicle(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete('vehicles/:id')
  @Permissions({ module: 'transportation', action: 'delete' })
  removeVehicle(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  // ---------- Drivers ----------

  @Post('drivers')
  @Permissions({ module: 'transportation', action: 'create' })
  createDriver(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Get('drivers')
  @Permissions({ module: 'transportation', action: 'view' })
  findDrivers(@Query('tenantId') tenantId: string) {
    return this.driversService.findAllForTenant(tenantId);
  }

  // ---------- Parent self-service opt-out (declared above :id routes) ----------

  @Get('opt-outs/my-child')
  findMyChildOptOut(@Query('studentId') studentId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const resolved = resolveParentOnlyStudentId(user, studentId);
    return this.optOutsService.findForStudent(resolved);
  }

  @Post('opt-outs/my-child')
  setMyChildOptOut(@Body() dto: CreateStudentTransportOptOutDto, @CurrentUser() user: AuthenticatedUser) {
    // Ownership check uses the DTO's own student_id — a parent can only ever
    // opt out a student linked to their own account, regardless of what's
    // sent in the body.
    resolveParentOnlyStudentId(user, dto.student_id);
    return this.optOutsService.create(dto);
  }

  @Delete('opt-outs/my-child/:studentId')
  removeMyChildOptOut(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const resolved = resolveParentOnlyStudentId(user, studentId);
    return this.optOutsService.removeForStudent(resolved, academicYearId);
  }

  // ---------- Opt-outs (staff view, for filtering assignment pickers) ----------

  @Get('opt-outs')
  @Permissions({ module: 'transportation', action: 'view' })
  findOptOuts(@Query('tenantId') tenantId: string, @Query('academicYearId') academicYearId?: string) {
    return this.optOutsService.findAllForTenant(tenantId, academicYearId);
  }

  @Get('drivers/:id')
  @Permissions({ module: 'transportation', action: 'view' })
  findDriver(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch('drivers/:id')
  @Permissions({ module: 'transportation', action: 'edit' })
  updateDriver(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }

  @Delete('drivers/:id')
  @Permissions({ module: 'transportation', action: 'delete' })
  removeDriver(@Param('id') id: string) {
    return this.driversService.remove(id);
  }

  // ---------- Routes + Stops ----------

  @Post('routes')
  @Permissions({ module: 'transportation', action: 'create' })
  createRoute(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get('routes')
  @Permissions({ module: 'transportation', action: 'view' })
  findRoutes(@Query('tenantId') tenantId: string) {
    return this.routesService.findAllForTenant(tenantId);
  }

  @Get('routes/:id')
  @Permissions({ module: 'transportation', action: 'view' })
  findRoute(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Patch('routes/:id')
  @Permissions({ module: 'transportation', action: 'edit' })
  updateRoute(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Delete('routes/:id')
  @Permissions({ module: 'transportation', action: 'delete' })
  removeRoute(@Param('id') id: string) {
    return this.routesService.remove(id);
  }

  @Post('routes/:id/stops')
  @Permissions({ module: 'transportation', action: 'create' })
  addStop(@Param('id') routeId: string, @Body() dto: CreateRouteStopDto) {
    return this.routesService.addStop({ ...dto, route_id: routeId });
  }

  @Get('routes/:id/stops')
  @Permissions({ module: 'transportation', action: 'view' })
  findStops(@Param('id') routeId: string) {
    return this.routesService.findStopsForRoute(routeId);
  }

  @Delete('stops/:id')
  @Permissions({ module: 'transportation', action: 'delete' })
  removeStop(@Param('id') id: string) {
    return this.routesService.removeStop(id);
  }

  // ---------- Route Assignments (vehicle + driver -> route) ----------

  @Post('route-assignments')
  @Permissions({ module: 'transportation', action: 'create' })
  createRouteAssignment(@Body() dto: CreateRouteAssignmentDto) {
    return this.routeAssignmentsService.create(dto);
  }

  @Get('route-assignments')
  @Permissions({ module: 'transportation', action: 'view' })
  findRouteAssignments(@Query('tenantId') tenantId: string, @Query('academicYearId') academicYearId?: string) {
    return this.routeAssignmentsService.findAllForTenant(tenantId, academicYearId);
  }

  @Delete('route-assignments/:id')
  @Permissions({ module: 'transportation', action: 'delete' })
  removeRouteAssignment(@Param('id') id: string) {
    return this.routeAssignmentsService.remove(id);
  }

  // ---------- Student Transport Assignments ----------

  @Post('student-assignments')
  @Permissions({ module: 'transportation', action: 'create' })
  createStudentAssignment(@Body() dto: CreateStudentTransportAssignmentDto) {
    return this.studentAssignmentsService.create(dto);
  }

  @Get('student-assignments')
  @Permissions({ module: 'transportation', action: 'view' })
  findStudentAssignments(
    @Query('tenantId') tenantId: string,
    @Query('routeId') routeId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.studentAssignmentsService.findAllForTenant(tenantId, { routeId, academicYearId });
  }

  @Get('student-assignments/:id')
  @Permissions({ module: 'transportation', action: 'view' })
  findStudentAssignment(@Param('id') id: string) {
    return this.studentAssignmentsService.findOne(id);
  }

  @Patch('student-assignments/:id')
  @Permissions({ module: 'transportation', action: 'edit' })
  updateStudentAssignment(@Param('id') id: string, @Body() dto: UpdateStudentTransportAssignmentDto) {
    return this.studentAssignmentsService.update(id, dto);
  }

  @Delete('student-assignments/:id')
  @Permissions({ module: 'transportation', action: 'delete' })
  removeStudentAssignment(@Param('id') id: string) {
    return this.studentAssignmentsService.remove(id);
  }


  // ---------- Vehicle Maintenance Records ----------

  @Post('maintenance-records')
  @Permissions({ module: 'transportation', action: 'create' })
  createMaintenanceRecord(@Body() dto: CreateVehicleMaintenanceRecordDto) {
    return this.vehicleMaintenanceService.create(dto);
  }

  @Get('maintenance-records')
  @Permissions({ module: 'transportation', action: 'view' })
  findMaintenanceRecords(@Query('tenantId') tenantId: string, @Query('vehicleId') vehicleId?: string) {
    return this.vehicleMaintenanceService.findAllForTenantWithOverdueCheck(tenantId, vehicleId);
  }

  @Patch('maintenance-records/:id/complete')
  @Permissions({ module: 'transportation', action: 'edit' })
  completeMaintenanceRecord(@Param('id') id: string, @Body('completed_date') completedDate: string, @Body('cost') cost?: string) {
    return this.vehicleMaintenanceService.markCompleted(id, completedDate, cost);
  }
  
}
