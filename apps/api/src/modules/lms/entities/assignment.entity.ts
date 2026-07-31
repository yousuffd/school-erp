import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A single assignment (Blueprint Part 2, Module 6 — LMS). Tied to one
 * Subject + one Class + one Academic Year, same shape as Exam. Unlike
 * Exam, this has no bulk-scheduling equivalent yet — that's a natural
 * future enhancement (mirroring Exam Groups) if this becomes as manual
 * a pain point as single-exam creation was, but not built up front.
 */
@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  subject_id: string;

  @Column('uuid')
  school_class_id: string;

  @Column('uuid')
  academic_year_id: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  /** Full date+time, not just a date — late-submission flagging needs a precise cutoff. */
  @Column({ type: 'timestamp' })
  due_date: Date;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  max_score: string;

  @Column('uuid')
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
