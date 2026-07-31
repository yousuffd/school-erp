import { IsUUID } from 'class-validator';

export class SelectElectiveDto {
  @IsUUID()
  subject_id: string;
}