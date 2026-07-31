import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EmployeeStatus, EmploymentType } from '../entities/employee.entity';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsDateString()
  contract_end_date?: string;

  @IsOptional()
  @IsNumberString()
  base_salary?: string;
}