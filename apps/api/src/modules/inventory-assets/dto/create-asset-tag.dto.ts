import { IsDateString, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAssetTagDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  item_id: string;

  @IsUUID()
  campus_id: string;

  @IsString()
  @MaxLength(50)
  asset_tag_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  assigned_location?: string;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsNumberString()
  purchase_cost?: string;
}
