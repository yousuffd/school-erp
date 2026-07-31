import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuItemsService } from './menu-items.service';
import { DailyMenusService } from './daily-menus.service';
import { MealAttendanceService } from './meal-attendance.service';
import { DietaryRestrictionsService } from './dietary-restrictions.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateDailyMenuDto } from './dto/create-daily-menu.dto';
import { AddMenuItemToDailyMenuDto } from './dto/add-menu-item-to-daily-menu.dto';
import { RecordMealAttendanceDto } from './dto/record-meal-attendance.dto';
import { CreateDietaryRestrictionDto } from './dto/create-dietary-restriction.dto';
import { UpdateDietaryRestrictionDto } from './dto/update-dietary-restriction.dto';
import { MealType } from './entities/daily-menu.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequiresFeature } from '../../common/decorators/feature.decorator';

/**
 * Single consolidated controller for Cafeteria & Meal Management
 * (Blueprint Part 2, Module 22) — same pattern as Transportation/Health &
 * Wellness/Inventory & Assets, now the project default.
 *
 * Every resource area has its own top-level path segment (menu-items/,
 * daily-menus/, meal-attendance/, dietary-restrictions/), so no
 * route-ordering collision risk between areas.
 */
@ApiTags('cafeteria')
@ApiBearerAuth()
@RequiresFeature('cafeteria')
@Controller('cafeteria')
export class CafeteriaController {
  constructor(
    private readonly menuItemsService: MenuItemsService,
    private readonly dailyMenusService: DailyMenusService,
    private readonly mealAttendanceService: MealAttendanceService,
    private readonly dietaryRestrictionsService: DietaryRestrictionsService,
  ) {}

  // ---------- Menu Items (dish catalog) ----------

  @Post('menu-items')
  @Permissions({ module: 'cafeteria', action: 'create' })
  createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(dto);
  }

  @Get('menu-items')
  @Permissions({ module: 'cafeteria', action: 'view' })
  findMenuItems(@Query('tenantId') tenantId: string) {
    return this.menuItemsService.findAllForTenant(tenantId);
  }

  @Patch('menu-items/:id')
  @Permissions({ module: 'cafeteria', action: 'edit' })
  updateMenuItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuItemsService.update(id, dto);
  }

  @Delete('menu-items/:id')
  @Permissions({ module: 'cafeteria', action: 'delete' })
  removeMenuItem(@Param('id') id: string) {
    return this.menuItemsService.remove(id);
  }

  // ---------- Daily Menus ----------

  @Post('daily-menus')
  @Permissions({ module: 'cafeteria', action: 'create' })
  createDailyMenu(@Body() dto: CreateDailyMenuDto) {
    return this.dailyMenusService.create(dto);
  }

  @Get('daily-menus')
  @Permissions({ module: 'cafeteria', action: 'view' })
  findDailyMenus(
    @Query('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.dailyMenusService.findAllForTenant(tenantId, dateFrom, dateTo);
  }

  @Get('daily-menus/:id')
  @Permissions({ module: 'cafeteria', action: 'view' })
  findDailyMenu(@Param('id') id: string) {
    return this.dailyMenusService.findOne(id);
  }

  @Delete('daily-menus/:id')
  @Permissions({ module: 'cafeteria', action: 'delete' })
  removeDailyMenu(@Param('id') id: string) {
    return this.dailyMenusService.remove(id);
  }

  @Post('daily-menus/:id/items')
  @Permissions({ module: 'cafeteria', action: 'edit' })
  addMenuItemToDailyMenu(@Param('id') dailyMenuId: string, @Body() dto: AddMenuItemToDailyMenuDto) {
    return this.dailyMenusService.addMenuItem(dailyMenuId, dto);
  }

  @Delete('daily-menu-items/:id')
  @Permissions({ module: 'cafeteria', action: 'edit' })
  removeDailyMenuItem(@Param('id') id: string) {
    return this.dailyMenusService.removeMenuItem(id);
  }

  // ---------- Meal Attendance ----------

  @Post('meal-attendance')
  @Permissions({ module: 'cafeteria', action: 'create' })
  @RequiresFeature('cafeteria.meal_attendance')
  recordMealAttendance(@Body() dto: RecordMealAttendanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mealAttendanceService.recordBulk(dto, user.userId);
  }

  @Get('meal-attendance')
  @Permissions({ module: 'cafeteria', action: 'view' })
  @RequiresFeature('cafeteria.meal_attendance')
  findMealAttendance(
    @Query('tenantId') tenantId: string,
    @Query('date') date: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.mealAttendanceService.findForDate(tenantId, date, mealType);
  }

  @Get('meal-attendance/headcounts')
  @Permissions({ module: 'cafeteria', action: 'view' })
  @RequiresFeature('cafeteria.meal_attendance')
  getHeadcounts(
    @Query('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.mealAttendanceService.getHeadcounts(tenantId, dateFrom, dateTo);
  }

  // ---------- Dietary Restrictions ----------

  @Post('dietary-restrictions')
  @Permissions({ module: 'cafeteria', action: 'create' })
  @RequiresFeature('cafeteria.dietary_restrictions')
  createDietaryRestriction(@Body() dto: CreateDietaryRestrictionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.dietaryRestrictionsService.create(dto, user.userId);
  }

  @Get('dietary-restrictions')
  @Permissions({ module: 'cafeteria', action: 'view' })
  @RequiresFeature('cafeteria.dietary_restrictions')
  findDietaryRestrictions(@Query('tenantId') tenantId: string, @Query('studentId') studentId?: string) {
    return this.dietaryRestrictionsService.findAllForTenant(tenantId, studentId);
  }

  @Patch('dietary-restrictions/:id')
  @Permissions({ module: 'cafeteria', action: 'edit' })
  @RequiresFeature('cafeteria.dietary_restrictions')
  updateDietaryRestriction(@Param('id') id: string, @Body() dto: UpdateDietaryRestrictionDto) {
    return this.dietaryRestrictionsService.update(id, dto);
  }

  @Delete('dietary-restrictions/:id')
  @Permissions({ module: 'cafeteria', action: 'delete' })
  @RequiresFeature('cafeteria.dietary_restrictions')
  removeDietaryRestriction(@Param('id') id: string) {
    return this.dietaryRestrictionsService.remove(id);
  }
}
