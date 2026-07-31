import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_elective?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  elective_group?: string;

}
