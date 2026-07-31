import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';

/**
 * One student's submission for one assignment. File-upload only (per
 * decision — no text-entry option). student_id is set from the verified
 * JWT (req.user.studentId) server-side, never trusted from the request
 * body — the one deliberate exception to this project's usual "client
 * supplies tenant_id/etc." pattern, because ownership correctness here is
 * actually security-relevant, not just a style question.
 *
 * Resubmission (before grading) UPDATES this same row — see
 * AssignmentSubmissionsService.submit() — rather than creating a new one,
 * which is why (tenant_id, assignment_id, student_id) is unique.
 */
@Entity('assignment_submissions')
@Index(['tenant_id', 'assignment_id', 'student_id'], { unique: true })
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  assignment_id: string;

  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column('uuid')
  student_id: string;

  /** Relative path under the uploads root — never the absolute filesystem path. */
  @Column({ length: 500 })
  file_path: string;

  @Column({ length: 255 })
  original_filename: string;

  @Column({ length: 100 })
  mime_type: string;

  @Column('int')
  file_size: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  submitted_at: Date;

  @Column({ default: false })
  is_late: boolean;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  score?: string;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column('uuid', { nullable: true })
  graded_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  graded_at?: Date;

  /** Always the submitting student's own userId — no staff-upload path in v1. */
  @Column('uuid')
  uploaded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
