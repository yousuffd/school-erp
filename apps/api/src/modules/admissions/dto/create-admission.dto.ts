import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AdmissionSource } from '../entities/admission.entity';

export class CreateAdmissionDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  campus_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  @MaxLength(100)
  applicant_first_name: string;

  @IsString()
  @MaxLength(100)
  applicant_last_name: string;

  @IsDateString()
  date_of_birth: string;

  @IsString()
  @MaxLength(40)
  desired_grade_level: string;

  @IsString()
  @MaxLength(150)
  guardian_name: string;

  @IsString()
  @MaxLength(32)
  guardian_phone: string;

  @IsOptional()
  @IsEmail()
  guardian_email?: string;

  @IsOptional()
  @IsEnum(AdmissionSource)
  source?: AdmissionSource;

  @IsOptional()
  @IsString()
  notes?: string;
}
