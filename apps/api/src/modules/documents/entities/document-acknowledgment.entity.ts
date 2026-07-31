import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Generalizes HrDocumentAcknowledgment — keyed on acknowledged_by (a
 * user_id) rather than employee_id, since documents now span student/
 * staff/hr_policy categories and an acknowledging caller might be a
 * Parent or Student, not just a staff Employee. Migrated rows from
 * hr_document_acknowledgments have their employee_id REMAPPED to the
 * linked user_id via a join against employees.user_id — see
 * MigrateHrPolicyDocuments for the exact logic and how skipped rows
 * (an employee with no linked user) are handled.
 */
@Entity('document_acknowledgments')
@Index(['tenant_id', 'document_id', 'acknowledged_by'], { unique: true })
export class DocumentAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  document_id: string;

  @Column('uuid')
  acknowledged_by: string;

  @CreateDateColumn()
  acknowledged_at: Date;
}
