import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance-record.entity';

class StudentAttendanceEntry {
  @IsUUID()
  student_id: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Marks (or re-marks/corrects) attendance for an entire class roster at once
 * — this is how attendance is actually taken in practice, not one student at
 * a time. Each entry is upserted: if a record already exists for that
 * student/class/date, it's updated rather than duplicated.
 */
export class MarkAttendanceDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  school_class_id: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceEntry)
  entries: StudentAttendanceEntry[];
}
