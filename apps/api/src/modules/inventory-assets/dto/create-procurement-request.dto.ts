import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProcurementRequestDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  item_id: string;

  @IsUUID()
  campus_id: string;

  @IsInt()
  @Min(1)
  quantity_requested: number;

  @IsDateString()
  requested_date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
