import { IsDateString, IsEmail, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EmploymentType } from '../entities/employee.entity';

export class CreateEmployeeDto {
  @IsUUID()
  tenant_id: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  department: string;

  @IsString()
  @MaxLength(100)
  designation: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @IsDateString()
  date_of_joining: string;

  @IsOptional()
  @IsDateString()
  contract_end_date?: string;

  @IsOptional()
  @IsNumberString()
  base_salary?: string;
}