import { IsDateString, IsUUID } from 'class-validator';

export class AddToRosterDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsDateString()
  joined_date: string;
}
