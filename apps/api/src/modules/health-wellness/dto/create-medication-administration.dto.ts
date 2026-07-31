import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMedicationAdministrationDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsString()
  @MaxLength(150)
  medication_name: string;

  @IsString()
  @MaxLength(50)
  dosage: string;

  @IsDateString()
  administered_at: string;

  @IsBoolean()
  consent_confirmed: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
