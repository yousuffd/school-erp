import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaymentMethod } from '../entities/fee-payment.entity';

export class CreateFeePaymentDto {
  @IsUUID()
  fee_assignment_id: string;

  @IsOptional()
  @IsUUID()
  fee_installment_id?: string;

  @IsNumberString()
  amount: string;

  @IsDateString()
  payment_date: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
