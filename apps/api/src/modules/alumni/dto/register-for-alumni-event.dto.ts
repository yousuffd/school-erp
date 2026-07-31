import { IsUUID } from 'class-validator';

export class RegisterForAlumniEventDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  alumni_id: string;
}
