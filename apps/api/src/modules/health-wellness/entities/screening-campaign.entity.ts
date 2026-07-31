import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ScreeningType {
  VISION = 'vision',
  DENTAL = 'dental',
  BMI = 'bmi',
  OTHER = 'other',
}

/**
 * A school-wide (or per-class) health screening campaign (Blueprint Part 2,
 * Module 16 — "Screening campaigns (vision, dental, BMI) with parent
 * reports"). Per-student outcomes live in ScreeningResult, a campaign is
 * just the event definition.
 */
@Entity('screening_campaigns')
export class ScreeningCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: ScreeningType })
  screening_type: ScreeningType;

  @Column({ type: 'date' })
  campaign_date: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
