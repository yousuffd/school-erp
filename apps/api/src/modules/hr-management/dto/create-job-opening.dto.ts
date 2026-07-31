import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateJobOpeningDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  title: string;

  @IsString()
  @MaxLength(100)
  department: string;

  @IsOptional()
  @IsString()
  description?: string;
}