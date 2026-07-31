import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AssetTagStatus } from '../entities/asset-tag.entity';

export class UpdateAssetTagDto {
  @IsOptional()
  @IsEnum(AssetTagStatus)
  status?: AssetTagStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  assigned_location?: string;
}
