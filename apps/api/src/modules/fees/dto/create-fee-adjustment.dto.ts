import { IsEnum, IsNumberString, IsString, IsUUID, MaxLength } from 'class-validator';
import { FeeAdjustmentType } from '../entities/fee-adjustment.entity';

export class CreateFeeAdjustmentDto {
  @IsUUID()
  fee_assignment_id: string;

  @IsEnum(FeeAdjustmentType)
  type: FeeAdjustmentType;

  @IsNumberString()
  amount: string;

  @IsString()
  @MaxLength(255)
  reason: string;
}
