import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { StockTransactionType } from '../entities/stock-transaction.entity';

export class RecordStockTransactionDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  item_id: string;

  @IsUUID()
  campus_id: string;

  @IsEnum(StockTransactionType)
  transaction_type: StockTransactionType;

  // Meaning depends on transaction_type — see stock-transaction.entity.ts:
  // RECEIVED/ISSUED = amount moved (always >= 0), ADJUSTED = new absolute count.
  @IsInt()
  @Min(0)
  quantity: number;

  @IsDateString()
  transaction_date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
