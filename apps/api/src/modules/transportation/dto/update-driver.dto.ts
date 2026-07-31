import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DriverStatus } from '../entities/driver.entity';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  license_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
