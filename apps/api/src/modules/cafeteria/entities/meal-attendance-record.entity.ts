import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MealType } from './daily-menu.entity';

/**
 * One student's presence at one meal on one date (Blueprint Part 2,
 * Module 22 — "Meal attendance / headcount"). Existence of a row means
 * "this student ate this meal" — headcount totals are a COUNT query
 * grouped by (date, meal_type), not a separately maintained aggregate.
 */
@Entity('meal_attendance_records')
@Index(['tenant_id', 'attendance_date', 'meal_type', 'student_id'], { unique: true })
export class MealAttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'date' })
  attendance_date: string;

  @Column({ type: 'enum', enum: MealType })
  meal_type: MealType;

  @Column('uuid')
  recorded_by: string;

  @CreateDateColumn()
  created_at: Date;
}
