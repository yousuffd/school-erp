import { IsDateString, IsUUID } from 'class-validator';

export class CreateRoomAllocationDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  room_id: string;

  @IsUUID()
  student_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsDateString()
  allocated_date: string;
}