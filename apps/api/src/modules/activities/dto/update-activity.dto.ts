import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ActivityCategory } from '../entities/activity.entity';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @IsOptional()
  @IsString()
  description?: string;
}
