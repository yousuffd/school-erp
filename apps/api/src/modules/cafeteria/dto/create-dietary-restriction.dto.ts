import { IsEnum, IsString, IsUUID } from 'class-validator';
import { DietaryRestrictionType } from '../entities/student-dietary-restriction.entity';

export class CreateDietaryRestrictionDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsEnum(DietaryRestrictionType)
  restriction_type: DietaryRestrictionType;

  @IsString()
  details: string;
}
