import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Driver } from './entities/driver.entity';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { RouteAssignment } from './entities/route-assignment.entity';
import { StudentTransportAssignment } from './entities/student-transport-assignment.entity';
import { StudentTransportOptOut } from './entities/student-transport-opt-out.entity';
import { VehiclesService } from './vehicles.service';
import { DriversService } from './drivers.service';
import { RoutesService } from './routes.service';
import { RouteAssignmentsService } from './route-assignments.service';
import { StudentTransportAssignmentsService } from './student-transport-assignments.service';
import { StudentTransportOptOutsService } from './student-transport-opt-outs.service';
import { TransportationController } from './transportation.controller';
import { VehicleMaintenanceRecord } from './entities/vehicle-maintenance-record.entity';
import { VehicleMaintenanceService } from './vehicle-maintenance.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, Driver, Route, RouteStop, RouteAssignment, StudentTransportAssignment, VehicleMaintenanceRecord, StudentTransportOptOut]),
  ],
  controllers: [TransportationController],
  providers: [
    VehiclesService,
    DriversService,
    RoutesService,
    RouteAssignmentsService,
    StudentTransportAssignmentsService,
    VehicleMaintenanceService,
    StudentTransportOptOutsService,
  ],
  exports: [
    VehiclesService,
    DriversService,
    RoutesService,
    RouteAssignmentsService,
    StudentTransportAssignmentsService,
    VehicleMaintenanceService,
    StudentTransportOptOutsService,
  ],
})
export class TransportationModule {}
