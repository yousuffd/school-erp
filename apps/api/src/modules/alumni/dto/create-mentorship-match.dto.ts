import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMentorshipMatchDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  mentor_alumni_id: string;

  @IsUUID()
  mentee_student_id: string;

  @IsOptional() @IsString() notes?: string;
}
