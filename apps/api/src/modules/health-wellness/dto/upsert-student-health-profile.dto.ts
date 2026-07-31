import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BloodGroup } from '../entities/student-health-profile.entity';

export class UpsertStudentHealthProfileDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsEnum(BloodGroup)
  blood_group?: BloodGroup;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronic_conditions?: string;
}
