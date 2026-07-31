import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumberString, IsOptional, IsUUID, ValidateNested } from 'class-validator';

class StudentMarksEntry {
  @IsUUID()
  student_id: string;

  /** Omitted or null means absent — distinct from a genuine 0. */
  @IsOptional()
  @IsNumberString()
  marks_obtained?: string;
}

export class EnterMarksDto {
  @IsUUID()
  exam_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentMarksEntry)
  entries: StudentMarksEntry[];
}
