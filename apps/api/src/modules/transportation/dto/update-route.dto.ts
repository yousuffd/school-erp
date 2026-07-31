import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
