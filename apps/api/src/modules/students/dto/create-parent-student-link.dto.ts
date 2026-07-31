import { IsUUID } from 'class-validator';

export class CreateParentStudentLinkDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  parent_user_id: string;

  @IsUUID()
  student_id: string;
}
