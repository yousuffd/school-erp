import { IsEnum, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { VehicleStatus } from '../entities/vehicle.entity';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
