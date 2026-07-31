import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLectureDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  subject_id: string;

  @IsUUID()
  school_class_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
