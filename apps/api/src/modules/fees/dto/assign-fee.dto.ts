import { IsUUID } from 'class-validator';

export class AssignFeeDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  fee_structure_id: string;
}
