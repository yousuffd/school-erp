import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DonationPaymentMethod } from '../entities/donation.entity';

export class CreateDonationDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  alumni_id: string;

  @IsNumberString()
  amount: string;

  @IsDateString()
  donation_date: string;

  @IsOptional() @IsString() @MaxLength(200) purpose?: string;

  @IsEnum(DonationPaymentMethod)
  payment_method: DonationPaymentMethod;

  @IsOptional() @IsString() notes?: string;
}
