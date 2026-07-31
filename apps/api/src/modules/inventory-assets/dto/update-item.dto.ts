import { IsEnum, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { ItemCategory } from '../entities/item.entity';

// is_trackable_asset is deliberately NOT updatable here — flipping it after
// stock/asset-tag records already exist for the item would leave orphaned
// data in whichever tracking mode was abandoned. If that switch is ever
// genuinely needed, it should be a deliberate migration path, not a
// PATCH field.
export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorder_point?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
