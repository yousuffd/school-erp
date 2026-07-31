import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

/**
 * Daily attendance (Blueprint Part 2, Module 7). Phase 1 first cut is
 * daily-granularity only — one record per student per class per day.
 * Period-wise attendance (tying a record to a specific TimetableSlot instead
 * of just a date) is a real follow-on increment, not done here.
 *
 * Deliberately NOT included yet:
 *   - Leave requests & approval workflow (a separate feature in its own right)
 *   - Biometric/RFID/QR device integration (manual entry only for now)
 *   - Real-time parent notifications (blocked on Communication module, which
 *     doesn't exist yet — recording attendance works today, notifying a
 *     parent about it doesn't)
 *   - Compliance-threshold reporting (needs a few weeks of real data to be
 *     meaningful anyway)
 */
@Entity('attendance_records')
@Index(['tenant_id', 'school_class_id', 'student_id', 'date'], { unique: true })
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  school_class_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  /** The teacher/admin who marked this record. */
  @Column('uuid')
  marked_by: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
