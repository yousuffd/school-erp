import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAlumniEventDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsDateString()
  event_date: string;

  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() description?: string;
}
