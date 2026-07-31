import { IsOptional, IsUUID } from 'class-validator';

export class AdminSetElectiveSelectionDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsUUID()
  subject_id: string;

  /** Defaults to the tenant's current academic year if omitted. */
  @IsOptional()
  @IsUUID()
  academic_year_id?: string;
}