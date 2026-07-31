import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum CorrectiveActionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

/** Blueprint Part 2, Module 20 — "corrective-action tracking", tied to a specific incident. */
@Entity('corrective_actions')
export class CorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  incident_id: string;

  @Column({ type: 'text' })
  description: string;

  @Column('uuid')
  assigned_to: string;

  @Column({ type: 'date' })
  due_date: string;

  @Column({ type: 'date', nullable: true })
  completed_date?: string | null;

  @Column({ type: 'enum', enum: CorrectiveActionStatus, default: CorrectiveActionStatus.PENDING })
  status: CorrectiveActionStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
