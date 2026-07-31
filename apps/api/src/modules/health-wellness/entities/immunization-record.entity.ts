import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One immunization/vaccination record for a student (Blueprint Part 2,
 * Module 16). A student has many of these — separate table, not a field
 * on StudentHealthProfile.
 */
@Entity('immunization_records')
export class ImmunizationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ length: 150 })
  vaccine_name: string;

  @Column({ type: 'date' })
  date_administered: string;

  @Column('uuid')
  recorded_by: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
