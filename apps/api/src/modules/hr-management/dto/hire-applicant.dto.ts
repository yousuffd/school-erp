import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EmploymentType } from '../entities/employee.entity';

export class HireApplicantDto {
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
  @IsUUID()
  manager_id?: string;

  @IsOptional()
  @IsNumberString()
  base_salary?: string;
}