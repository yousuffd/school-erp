import { IsUUID } from 'class-validator';

export class CreateStudentTransportAssignmentDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsUUID()
  route_id: string;

  @IsUUID()
  stop_id: string;

  @IsUUID()
  academic_year_id: string;
}
