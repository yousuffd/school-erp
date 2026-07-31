import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  room_id: string;

  @IsString()
  description: string;

  @IsUUID()
  reported_by: string;

  @IsDateString()
  reported_date: string;
}