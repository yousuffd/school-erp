import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBookCopyDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  book_id: string;

  @IsUUID()
  campus_id: string;

  @IsString()
  @MaxLength(50)
  barcode: string;
}
