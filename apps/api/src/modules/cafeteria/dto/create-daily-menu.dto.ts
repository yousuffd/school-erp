import { IsDateString, IsEnum, IsUUID } from 'class-validator';
import { MealType } from '../entities/daily-menu.entity';

export class CreateDailyMenuDto {
  @IsUUID()
  tenant_id: string;

  @IsDateString()
  menu_date: string;

  @IsEnum(MealType)
  meal_type: MealType;
}
