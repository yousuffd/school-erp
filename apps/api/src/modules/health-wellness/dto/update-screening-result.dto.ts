import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateScreeningResultDto {
  @IsOptional()
  @IsString()
  result_summary?: string;

  @IsOptional()
  @IsBoolean()
  flagged_for_followup?: boolean;
}
