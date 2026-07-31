import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReviewerType {
  SELF = 'self',
  PEER = 'peer',
  MANAGER = 'manager',
}

/**
 * "360°" support: multiple PerformanceReview rows per employee per cycle,
 * one per reviewer_type. calibrated_rating is set by HR Manager once all
 * reviewer rows for a cycle exist — a real but proportionate calibration
 * step, not a full committee-voting workflow.
 */
@Entity('performance_reviews')
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  cycle_id: string;

  @Column('uuid')
  employee_id: string;

  @Column('uuid')
  reviewer_id: string;

  @Column({ type: 'enum', enum: ReviewerType })
  reviewer_type: ReviewerType;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'int', nullable: true })
  calibrated_rating?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}