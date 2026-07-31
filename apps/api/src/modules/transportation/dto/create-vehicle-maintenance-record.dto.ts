import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MaintenanceType } from '../entities/vehicle-maintenance-record.entity';

export class CreateVehicleMaintenanceRecordDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  vehicle_id: string;

  @IsEnum(MaintenanceType)
  maintenance_type: MaintenanceType;

  @IsString()
  description: string;

  @IsDateString()
  scheduled_date: string;

  @IsOptional()
  @IsNumberString()
  cost?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor_name?: string;
}