import { IsEnum } from 'class-validator';
import { IncidentStatus } from '../entities/behavior-incident.entity';

export class UpdateIncidentStatusDto {
  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}
