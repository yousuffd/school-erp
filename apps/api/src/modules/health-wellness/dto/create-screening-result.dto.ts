import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateScreeningResultDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  campaign_id: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsString()
  result_summary?: string;

  @IsOptional()
  @IsBoolean()
  flagged_for_followup?: boolean;
}
