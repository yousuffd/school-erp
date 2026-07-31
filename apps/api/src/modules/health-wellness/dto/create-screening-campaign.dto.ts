import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ScreeningType } from '../entities/screening-campaign.entity';

export class CreateScreeningCampaignDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(ScreeningType)
  screening_type: ScreeningType;

  @IsDateString()
  campaign_date: string;

  @IsOptional()
  @IsString()
  description?: string;
}
