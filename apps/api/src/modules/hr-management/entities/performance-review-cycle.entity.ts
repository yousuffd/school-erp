import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReviewCycleStatus {
  OPEN = 'open',
  CALIBRATING = 'calibrating',
  CLOSED = 'closed',
}

@Entity('performance_review_cycles')
export class PerformanceReviewCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  cycle_name: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'enum', enum: ReviewCycleStatus, default: ReviewCycleStatus.OPEN })
  status: ReviewCycleStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}