import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AudienceScope, CircularPriority } from '../entities/circular.entity';

export class CreateCircularDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsEnum(CircularPriority)
  priority?: CircularPriority;

  @IsEnum(AudienceScope)
  audience_scope: AudienceScope;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  audience_grade_level?: string;

  @IsOptional()
  @IsUUID()
  audience_school_class_id?: string;
}
