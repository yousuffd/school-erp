import { IsDateString, IsEnum, IsInt, IsString, IsUUID } from 'class-validator';
import { IncidentType } from '../entities/behavior-incident.entity';

export class CreateIncidentDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsDateString()
  incident_date: string;

  @IsEnum(IncidentType)
  incident_type: IncidentType;

  @IsInt()
  points: number;

  @IsString()
  description: string;
}
