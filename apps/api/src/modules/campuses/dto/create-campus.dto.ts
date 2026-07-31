import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCampusDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
