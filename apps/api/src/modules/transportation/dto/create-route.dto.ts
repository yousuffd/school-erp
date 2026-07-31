import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRouteDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
