import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClinicVisitDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsDateString()
  visit_date: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  treatment_given?: string;

  @IsOptional()
  @IsBoolean()
  follow_up_required?: boolean;
}
