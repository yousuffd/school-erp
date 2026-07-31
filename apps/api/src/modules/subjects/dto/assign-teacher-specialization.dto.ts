import { IsUUID } from 'class-validator';

export class AssignTeacherSpecializationDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  teacher_id: string;

  @IsUUID()
  subject_id: string;
}