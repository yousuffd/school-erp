import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActivityCategory } from '../entities/activity.entity';

export class CreateActivityDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(ActivityCategory)
  category: ActivityCategory;

  @IsOptional()
  @IsString()
  description?: string;
}
