import { IsUUID } from 'class-validator';

export class CreateClassElectiveOfferingDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  school_class_id: string;

  @IsUUID()
  subject_id: string;
}