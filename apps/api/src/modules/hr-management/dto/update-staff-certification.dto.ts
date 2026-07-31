import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStaffCertificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  certification_name?: string;

  @IsOptional()
  @IsDateString()
  issued_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;
}