import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { HostelAttendanceStatus } from '../entities/hostel-attendance-record.entity';

class HostelAttendanceEntry {
  @IsUUID()
  student_id: string;

  @IsEnum(HostelAttendanceStatus)
  status: HostelAttendanceStatus;

  @IsOptional()
  @IsString()
  curfew_check_in_time?: string;
}

export class RecordHostelAttendanceDto {
  @IsUUID()
  tenant_id: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HostelAttendanceEntry)
  entries: HostelAttendanceEntry[];
}