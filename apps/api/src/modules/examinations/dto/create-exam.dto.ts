import { IsDateString, IsNumberString, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateExamDto {
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
  name: string;

  @IsDateString()
  exam_date: string;

  @IsNumberString()
  max_marks: string;
}
