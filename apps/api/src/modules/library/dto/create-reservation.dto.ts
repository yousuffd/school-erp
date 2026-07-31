import { IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  book_id: string;

  @IsUUID()
  student_id: string;
}
