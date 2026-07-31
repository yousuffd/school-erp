import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Certificate/award issuance (Blueprint Part 2, Module 21 — "Certificate/
 * award issuance"). Deliberately minimal — a structured record of WHAT was
 * awarded, not an actual generated/stored certificate document, since
 * Document Management (Module 19) doesn't exist yet either. Same
 * acknowledgment-only deferral pattern used for HR's e-signing feature.
 */
@Entity('awards')
export class Award {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid', { nullable: true })
  event_id?: string | null;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'date' })
  awarded_date: string;

  @Column('uuid')
  issued_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
