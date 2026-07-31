import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateRouteStopDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  route_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsInt()
  @Min(1)
  sequence_order: number;

  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @IsOptional()
  @IsLongitude()
  longitude?: string;
}
