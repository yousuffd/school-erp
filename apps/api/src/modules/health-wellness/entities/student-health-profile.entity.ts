import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'unknown',
}

/**
 * Structured health profile, one row per student (Blueprint Part 2,
 * Module 16 — "Student health profiles (allergies, conditions,
 * immunization records)"). Deliberately separate from
 * Student.medical_notes (Phase 1 free-text field) — that stays as a
 * quick unstructured note; this holds real structured fields a clinic
 * workflow actually needs (allergy list a nurse can scan at a glance,
 * not a paragraph to read).
 *
 * Immunization records are NOT inline here — see ImmunizationRecord,
 * a student can have many, so it's its own table, not a text field.
 *
 * Counseling case management (confidentiality-tiered) is deliberately
 * NOT included this pass — Advanced/Premium tier per the blueprint,
 * explicitly deferred to a follow-up round.
 */
@Entity('student_health_profiles')
@Index(['tenant_id', 'student_id'], { unique: true })
export class StudentHealthProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'enum', enum: BloodGroup, default: BloodGroup.UNKNOWN })
  blood_group: BloodGroup;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  chronic_conditions?: string;

  @Column('uuid')
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
