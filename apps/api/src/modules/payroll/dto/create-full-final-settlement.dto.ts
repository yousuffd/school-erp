import { IsDateString, IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class CreateFullFinalSettlementDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  employee_id: string;

  @IsDateString()
  last_working_date: string;

  @IsOptional()
  @IsNumberString()
  dues?: string;

  @IsOptional()
  @IsNumberString()
  deductions?: string;
}