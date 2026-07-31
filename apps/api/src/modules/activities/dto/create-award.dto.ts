import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAwardDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsUUID()
  event_id?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsDateString()
  awarded_date: string;
}
