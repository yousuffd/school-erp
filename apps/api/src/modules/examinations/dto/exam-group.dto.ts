import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubjectDefaultDto {
  @IsUUID()
  subject_id: string;

  @IsDateString()
  default_date: string;

  @IsInt()
  @Min(1)
  default_max_marks: number;
}

class CellOverrideDto {
  @IsUUID()
  subject_id: string;

  @IsUUID()
  school_class_id: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_marks?: number;
}

export class CreateExamGroupDto {
  // Matches CreateExamDto's convention: tenant_id is client-supplied, not
  // derived from the JWT server-side. This mirrors every other create-*
  // payload in this codebase (createExam, createCampus, createFeeStructure,
  // etc.) — not the pattern I'd choose from scratch, but changing it here
  // alone would create a second, inconsistent tenant-resolution mechanism
  // for one module only. Flagged as a project-wide item worth a dedicated
  // security pass later (server should derive tenant_id from the verified
  // JWT claim, never trust the client for it).
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  name: string; // e.g. "Mid-Term — Term 1"

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubjectDefaultDto)
  subjects: SubjectDefaultDto[];

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  school_class_ids: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CellOverrideDto)
  overrides?: CellOverrideDto[];
}

export class UpdateExamGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  // If provided, pushes a new default down to every child exam that does
  // NOT yet have marks entered. Exams with marks are skipped and reported
  // back in `skipped`, never silently overwritten.
  @IsOptional()
  @IsDateString()
  cascade_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cascade_max_marks?: number;
}