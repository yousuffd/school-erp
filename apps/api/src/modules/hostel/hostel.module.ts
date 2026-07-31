import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { RoomAllocation } from './entities/room-allocation.entity';
import { HostelVisitor } from './entities/hostel-visitor.entity';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { HostelAttendanceRecord } from './entities/hostel-attendance-record.entity';
import { RoomPreference } from './entities/room-preference.entity';
import { RoomsService } from './rooms.service';
import { RoomAllocationsService } from './room-allocations.service';
import { HostelVisitorsService } from './hostel-visitors.service';
import { MaintenanceRequestsService } from './maintenance-requests.service';
import { HostelAttendanceService } from './hostel-attendance.service';
import { RoomPreferencesService } from './room-preferences.service';
import { HostelController } from './hostel.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      RoomAllocation,
      HostelVisitor,
      MaintenanceRequest,
      HostelAttendanceRecord,
      RoomPreference,
    ]),
  ],
  controllers: [HostelController],
  providers: [
    RoomsService,
    RoomAllocationsService,
    HostelVisitorsService,
    MaintenanceRequestsService,
    HostelAttendanceService,
    RoomPreferencesService,
  ],
  exports: [
    RoomsService,
    RoomAllocationsService,
    HostelVisitorsService,
    MaintenanceRequestsService,
    HostelAttendanceService,
    RoomPreferencesService,
  ],
})
export class HostelModule {}