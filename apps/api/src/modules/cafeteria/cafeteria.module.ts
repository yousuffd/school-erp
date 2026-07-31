import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { DailyMenu } from './entities/daily-menu.entity';
import { DailyMenuItem } from './entities/daily-menu-item.entity';
import { MealAttendanceRecord } from './entities/meal-attendance-record.entity';
import { StudentDietaryRestriction } from './entities/student-dietary-restriction.entity';
import { MenuItemsService } from './menu-items.service';
import { DailyMenusService } from './daily-menus.service';
import { MealAttendanceService } from './meal-attendance.service';
import { DietaryRestrictionsService } from './dietary-restrictions.service';
import { CafeteriaController } from './cafeteria.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, DailyMenu, DailyMenuItem, MealAttendanceRecord, StudentDietaryRestriction]),
  ],
  controllers: [CafeteriaController],
  providers: [MenuItemsService, DailyMenusService, MealAttendanceService, DietaryRestrictionsService],
  exports: [MenuItemsService, DailyMenusService, MealAttendanceService, DietaryRestrictionsService],
})
export class CafeteriaModule {}
