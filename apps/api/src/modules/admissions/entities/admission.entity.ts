import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AdmissionSource {
  WALK_IN = 'walk_in',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  OTHER = 'other',
}

export enum AdmissionStage {
  INQUIRY = 'inquiry',
  APPLICATION_SUBMITTED = 'application_submitted',
  UNDER_REVIEW = 'under_review',
  WAITLISTED = 'waitlisted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ENROLLED = 'enrolled',
  WITHDRAWN = 'withdrawn',
}

/**
 * Admissions & Enrollment pipeline (Blueprint Part 2, Module 2). Phase 1 first
 * cut covers the core inquiry -> review -> decision -> enrollment pipeline —
 * the CRM-style lead tracking every school actually needs day one.
 *
 * Deliberately NOT included yet (real features in their own right, or
 * dependent on modules that don't exist):
 *   - Document upload & verification (needs Document Management, Phase 5)
 *   - Entrance exam scheduling/scoring, interview scheduling
 *   - Seat allocation & quota rules (RTE/reserved categories)
 *   - Fee-linked seat lock (needs Fee Management, not yet built)
 *   - Digital admission packet / ID card generation
 * These are genuine follow-on increments, not oversights.
 */
@Entity('admissions')
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  campus_id: string;

  /** The academic year being applied for. */
  @Column('uuid')
  academic_year_id: string;

  @Column({ length: 100 })
  applicant_first_name: string;

  @Column({ length: 100 })
  applicant_last_name: string;

  @Column({ type: 'date' })
  date_of_birth: string;

  @Column({ length: 40 })
  desired_grade_level: string;

  @Column({ length: 150 })
  guardian_name: string;

  @Column({ length: 32 })
  guardian_phone: string;

  @Column({ length: 254, nullable: true })
  guardian_email?: string;

  @Column({ type: 'enum', enum: AdmissionSource, default: AdmissionSource.OTHER })
  source: AdmissionSource;

  @Column({ type: 'enum', enum: AdmissionStage, default: AdmissionStage.INQUIRY })
  stage: AdmissionStage;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  /** Set only once the application is actually enrolled — links to the created Student. */
  @Column('uuid', { nullable: true })
  enrolled_student_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
