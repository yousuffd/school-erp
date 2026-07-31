import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateStaffCertificationDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  employee_id: string;

  @IsString()
  @MaxLength(150)
  certification_name: string;

  @IsDateString()
  issued_date: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;
}