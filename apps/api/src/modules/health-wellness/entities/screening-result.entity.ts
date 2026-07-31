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

import { ScreeningCampaign } from './screening-campaign.entity';

/**
 * A single student's outcome within a ScreeningCampaign (Blueprint Part 2,
 * Module 16). flagged_for_followup drives the "parent reports" angle —
 * a flagged result is what a follow-up notification/report would key off
 * of, though actually sending that notification isn't built this pass
 * (Communication module integration is a natural follow-up, not bundled
 * in here).
 */
@Entity('screening_results')
@Index(['tenant_id', 'campaign_id', 'student_id'], { unique: true })
export class ScreeningResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  campaign_id: string;

  @ManyToOne(() => ScreeningCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: ScreeningCampaign;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'text', nullable: true })
  result_summary?: string;

  @Column({ default: false })
  flagged_for_followup: boolean;

  @Column('uuid')
  recorded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
