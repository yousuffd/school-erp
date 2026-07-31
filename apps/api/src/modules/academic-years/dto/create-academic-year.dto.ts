import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAcademicYearDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(20)
  label: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}
