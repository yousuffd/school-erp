import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreatePayrollRunDto {
  @IsUUID()
  tenant_id: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2000)
  year: number;
}