import { Type } from 'class-transformer';
import { IsArray, IsNumberString, IsOptional, IsUUID, ValidateNested } from 'class-validator';

class PayrollAdjustment {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsNumberString()
  bonuses?: string;

  @IsOptional()
  @IsNumberString()
  overtime?: string;

  @IsOptional()
  @IsNumberString()
  reimbursements?: string;
}

/** Optional per-employee bonuses/overtime/reimbursements for this specific run — everything defaults to 0 if not provided. */
export class ProcessPayrollRunDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayrollAdjustment)
  adjustments?: PayrollAdjustment[];
}