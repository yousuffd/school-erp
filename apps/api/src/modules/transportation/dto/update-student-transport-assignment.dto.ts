import { IsOptional, IsUUID } from 'class-validator';

export class UpdateStudentTransportAssignmentDto {
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsUUID()
  stop_id?: string;
}
