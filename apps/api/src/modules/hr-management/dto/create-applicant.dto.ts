import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicantDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  job_opening_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  resume_url?: string;
}