import { IsUUID } from 'class-validator';

export class RegisterForEventDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;
}
