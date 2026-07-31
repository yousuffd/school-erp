import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateImmunizationRecordDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsString()
  @MaxLength(150)
  vaccine_name: string;

  @IsDateString()
  date_administered: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
