import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  SNACK = 'snack',
  DINNER = 'dinner',
}

/**
 * One meal slot on one date (Blueprint Part 2, Module 22 — "Meal plans &
 * weekly menus"). Which dishes appear on it is a separate join
 * (DailyMenuItem), not inline here — same reasoning as Route/RouteStop in
 * Transportation: the menu definition and its contents are separately
 * manageable.
 */
@Entity('daily_menus')
@Index(['tenant_id', 'menu_date', 'meal_type'], { unique: true })
export class DailyMenu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ type: 'date' })
  menu_date: string;

  @Column({ type: 'enum', enum: MealType })
  meal_type: MealType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
