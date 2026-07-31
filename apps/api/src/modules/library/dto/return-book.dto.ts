import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReturnBookDto {
  @IsString()
  barcode: string;

  @IsOptional()
  @IsBoolean()
  fine_paid?: boolean;
}
