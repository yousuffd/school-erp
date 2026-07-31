import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum CounselingReferralStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/** Blueprint Part 2, Module 20 — "Counseling referrals", tied to a specific incident. */
@Entity('counseling_referrals')
export class CounselingReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  incident_id: string;

  @Column('uuid')
  referred_to: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: CounselingReferralStatus, default: CounselingReferralStatus.PENDING })
  status: CounselingReferralStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
