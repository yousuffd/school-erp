import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DietaryRestrictionType } from '../entities/student-dietary-restriction.entity';

export class UpdateDietaryRestrictionDto {
  @IsOptional()
  @IsEnum(DietaryRestrictionType)
  restriction_type?: DietaryRestrictionType;

  @IsOptional()
  @IsString()
  details?: string;
}
