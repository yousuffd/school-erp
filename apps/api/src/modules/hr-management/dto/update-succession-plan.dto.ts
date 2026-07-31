import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReadinessLevel } from '../entities/succession-plan.entity';

export class UpdateSuccessionPlanDto {
  @IsOptional()
  @IsUUID()
  successor_employee_id?: string;

  @IsOptional()
  @IsEnum(ReadinessLevel)
  readiness_level?: ReadinessLevel;

  @IsOptional()
  @IsString()
  notes?: string;
}