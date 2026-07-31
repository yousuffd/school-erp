import { IsEnum, IsInt, IsUUID, Max, Min } from 'class-validator';
import { DayOfWeek } from '../entities/timetable-slot.entity';

export class CreateTimetableSlotDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  school_class_id: string;

  @IsUUID()
  subject_id: string;

  @IsUUID()
  teacher_id: string;

  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  @IsInt()
  @Min(1)
  @Max(12)
  period_number: number;
}
