import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  dietary_tags?: string;
}
