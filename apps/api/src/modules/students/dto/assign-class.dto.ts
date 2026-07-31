import { IsUUID } from 'class-validator';

export class AssignClassDto {
  @IsUUID()
  school_class_id: string;
}
