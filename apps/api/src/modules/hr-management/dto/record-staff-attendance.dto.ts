import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { StaffAttendanceStatus } from '../entities/staff-attendance-record.entity';

class StaffAttendanceEntry {
  @IsUUID()
  employee_id: string;

  @IsEnum(StaffAttendanceStatus)
  status: StaffAttendanceStatus;
}

export class RecordStaffAttendanceDto {
  @IsUUID()
  tenant_id: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StaffAttendanceEntry)
  entries: StaffAttendanceEntry[];
}