import { IsEnum } from 'class-validator';
import { PlanTier } from '../entities/tenant-subscription.entity';

export class ChangeTierDto {
  @IsEnum(PlanTier)
  plan_tier: PlanTier;
}
