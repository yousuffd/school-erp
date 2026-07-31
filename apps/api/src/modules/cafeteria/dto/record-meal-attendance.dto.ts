import { ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { MealType } from '../entities/daily-menu.entity';

export class RecordMealAttendanceDto {
  @IsUUID()
  tenant_id: string;

  @IsDateString()
  attendance_date: string;

  @IsEnum(MealType)
  meal_type: MealType;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  student_ids: string[];
}
