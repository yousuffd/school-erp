import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDriverDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(50)
  license_number: string;

  @IsString()
  @MaxLength(32)
  phone: string;
}
