import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';
import { ItemCategory } from '../entities/item.entity';

export class CreateItemDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(ItemCategory)
  category: ItemCategory;

  @IsString()
  @MaxLength(20)
  unit: string;

  @IsBoolean()
  is_trackable_asset: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorder_point?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
