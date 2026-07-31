import { IsNumberString, IsUUID } from 'class-validator';

export class CreateLoanAdvanceDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  employee_id: string;

  @IsNumberString()
  amount: string;

  @IsNumberString()
  monthly_recovery_amount: string;
}