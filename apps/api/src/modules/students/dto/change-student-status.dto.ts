import { IsEnum } from 'class-validator';
import { StudentLifecycleStatus } from '../entities/student.entity';

export class ChangeStudentStatusDto {
  @IsEnum(StudentLifecycleStatus)
  status: StudentLifecycleStatus;
}
