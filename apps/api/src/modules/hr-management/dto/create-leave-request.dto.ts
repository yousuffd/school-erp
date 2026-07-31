import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LeaveType } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  employee_id: string;

  @IsEnum(LeaveType)
  leave_type: LeaveType;

  @IsDateString()
  from_date: string;

  @IsDateString()
  to_date: string;

  @IsOptional()
  @IsString()
  reason?: string;
}