import { IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  campus_id: string;

  @IsString()
  @MaxLength(20)
  registration_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsInt()
  @Min(1)
  capacity: number;
}
