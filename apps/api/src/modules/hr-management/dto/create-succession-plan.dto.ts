import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSuccessionPlanDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  position_employee_id: string;

  @IsOptional()
  @IsUUID()
  successor_employee_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}