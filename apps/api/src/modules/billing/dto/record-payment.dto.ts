import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentMode } from '../entities/payment-record.entity';

export class RecordPaymentDto {
  @IsEnum(PaymentMode)
  payment_mode: PaymentMode;

  @IsNumberString()
  amount: string;

  @IsDateString()
  payment_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
