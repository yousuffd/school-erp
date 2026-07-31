import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A single medication administration event (Blueprint Part 2, Module 16
 * — "Medication administration tracking with consent"). consent_confirmed
 * is a simple boolean flag for this pass — a real digital-consent
 * workflow (guardian e-signature, expiry, revocation) is a separate
 * feature in its own right, not built here; this is the audit trail of
 * "was consent confirmed before administering," not the consent
 * management system itself.
 */
@Entity('medication_administrations')
export class MedicationAdministration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ length: 150 })
  medication_name: string;

  @Column({ length: 50 })
  dosage: string;

  @Column({ type: 'timestamp' })
  administered_at: Date;

  @Column('uuid')
  administered_by: string;

  @Column({ default: false })
  consent_confirmed: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
