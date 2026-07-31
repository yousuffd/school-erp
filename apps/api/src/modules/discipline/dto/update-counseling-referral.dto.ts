import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CounselingReferralStatus } from '../entities/counseling-referral.entity';

export class UpdateCounselingReferralDto {
  @IsOptional()
  @IsEnum(CounselingReferralStatus)
  status?: CounselingReferralStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
