import { IsNumberString } from 'class-validator';

export class UpdatePayrollSettingsDto {
  @IsNumberString()
  professional_tax_amount: string;
}