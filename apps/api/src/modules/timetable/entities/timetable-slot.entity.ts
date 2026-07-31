import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

/**
 * A single weekly timetable slot: this subject, taught by this teacher, in
 * this class, on this day, during this period. Deliberately period-numbered
 * (1, 2, 3...) rather than actual clock times — mapping period numbers to
 * real start/end times varies per school and is a reasonable follow-up, not
 * needed for the core "who teaches what, when" structure.
 */
/**
 * Uniqueness now includes subject_id, not just (class, day, period) —
 * loosened deliberately so an elective period can host MULTIPLE co-located
 * rows (e.g. French + Spanish + German all at Grade 6-B/Monday/Period-3,
 * one row per language teacher), with students splitting by their own
 * student_elective_selections rather than the class being locked to a
 * single elective subject. A genuine duplicate (same subject twice at the
 * same class/day/period) is still rejected. Real conflicts across
 * DIFFERENT subjects at the same slot are prevented at the application
 * layer (TimetableService.generateSchedule's occupancy check), not by this
 * DB constraint alone, since the DB has no way to know "these 3 rows are
 * intentionally co-located electives" vs. "these 2 rows are an accidental
 * double-booking of the same period for unrelated subjects."
 */
@Entity('timetable_slots')
@Index(['tenant_id', 'school_class_id', 'day_of_week', 'period_number', 'subject_id'], { unique: true })
export class TimetableSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  school_class_id: string;

  @Column('uuid')
  subject_id: string;

  @Column('uuid')
  teacher_id: string;

  @Column({ type: 'enum', enum: DayOfWeek })
  day_of_week: DayOfWeek;

  @Column({ type: 'int' })
  period_number: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
