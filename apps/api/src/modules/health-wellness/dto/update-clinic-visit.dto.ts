import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateClinicVisitDto {
  @IsOptional()
  @IsString()
  treatment_given?: string;

  @IsOptional()
  @IsBoolean()
  follow_up_required?: boolean;
}
