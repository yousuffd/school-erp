import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateCorrectiveActionDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  description: string;

  @IsUUID()
  assigned_to: string;

  @IsDateString()
  due_date: string;
}
