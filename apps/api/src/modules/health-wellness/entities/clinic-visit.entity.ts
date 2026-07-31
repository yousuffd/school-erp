import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A single clinic visit / incident log entry (Blueprint Part 2, Module 16
 * — "Clinic visit logs & incident reporting"). visit_date is a full
 * timestamp (not just a date) since multiple visits can happen the same
 * day and ordering by time-of-day matters for a clinic log.
 */
@Entity('clinic_visits')
export class ClinicVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'timestamp' })
  visit_date: Date;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  treatment_given?: string;

  @Column({ default: false })
  follow_up_required: boolean;

  @Column('uuid')
  recorded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
