import { IsUUID } from 'class-validator';

export class CreateStudentTransportOptOutDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsUUID()
  academic_year_id: string;
}
