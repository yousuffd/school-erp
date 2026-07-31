import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBookDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  @MaxLength(200)
  author: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  publisher?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  @IsOptional()
  @IsString()
  cover_url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
