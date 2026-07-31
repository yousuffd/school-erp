import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Gender } from '../entities/student.entity';

export class CreateStudentDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  campus_id: string;

  /**
   * Optional — StudentsService.create() auto-generates one (ADM-{year}-{seq})
   * when omitted, following the same "never trust the client for a
   * uniqueness-critical sequential value" principle as roll_number.
   * Still accepted if supplied (e.g. a school migrating existing
   * admission numbers from a prior system).
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  admission_number?: string;

  @IsString()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @MaxLength(100)
  last_name: string;

  @IsDateString()
  date_of_birth: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsString()
  @MaxLength(40)
  grade_level: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;

  @IsOptional()
  @IsUUID()
  school_class_id?: string;

  @IsUUID()
  academic_year_id: string;

  @IsDateString()
  enrollment_date: string;

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
  @IsString()
  @MaxLength(150)
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emergency_contact_phone?: string;

  @IsOptional()
  @IsString()
  medical_notes?: string;
}
