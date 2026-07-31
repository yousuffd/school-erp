import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCounselingReferralDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  referred_to: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
