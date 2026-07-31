import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSchoolClassDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  campus_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  @MaxLength(40)
  grade_level: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;

  @IsOptional()
  @IsUUID()
  class_teacher_id?: string;
}
