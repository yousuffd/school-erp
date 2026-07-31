import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateAssignmentDto {
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
  instructions?: string;

  @IsDateString()
  due_date: string;

  @IsNumber()
  @Min(1)
  @Max(9999)
  max_score: number;
}
