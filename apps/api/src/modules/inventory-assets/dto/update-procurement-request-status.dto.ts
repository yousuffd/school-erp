import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProcurementRequestStatus } from '../entities/procurement-request.entity';

export class UpdateProcurementRequestStatusDto {
  @IsEnum(ProcurementRequestStatus)
  status: ProcurementRequestStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
