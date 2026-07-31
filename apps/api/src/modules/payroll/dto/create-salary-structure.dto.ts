import { IsDateString, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSalaryStructureDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  employee_id: string;

  @IsNumberString()
  basic_salary: string;

  @IsOptional()
  @IsNumberString()
  hra?: string;

  @IsOptional()
  @IsNumberString()
  special_allowance?: string;

  @IsOptional()
  @IsNumberString()
  other_allowances?: string;

  @IsDateString()
  effective_from: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bank_account_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bank_ifsc_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bank_account_holder_name?: string;
}