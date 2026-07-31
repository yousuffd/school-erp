import { IsUUID } from 'class-validator';

/** Assigns a fee structure to every active student currently in a class, in one call. */
export class BulkAssignFeeDto {
  @IsUUID()
  school_class_id: string;

  @IsUUID()
  fee_structure_id: string;
}
