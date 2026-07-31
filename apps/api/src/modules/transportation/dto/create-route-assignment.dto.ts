import { IsUUID } from 'class-validator';

export class CreateRouteAssignmentDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  route_id: string;

  @IsUUID()
  vehicle_id: string;

  @IsUUID()
  driver_id: string;

  @IsUUID()
  academic_year_id: string;
}
