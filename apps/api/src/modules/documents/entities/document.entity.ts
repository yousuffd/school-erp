import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum DocumentCategory {
  HR_POLICY = 'hr_policy',
  STUDENT_DOCUMENT = 'student_document',
  STAFF_DOCUMENT = 'staff_document',
  OTHER = 'other',
}

export enum DocumentApprovalStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Blueprint Part 2, Module 19 — generalizes what used to be
 * HrPolicyDocument (HR Management) into a tenant-wide document repository
 * covering staff AND student documents, not just HR policies. Migrated
 * from hr_policy_documents via CreateDocumentsTables + MigrateHrPolicyDocuments
 * — see those migrations for the actual data-copy/remap logic.
 *
 * approval_status/approved_by are the MINIMAL "digital signatures &
 * approval chain" substitute — a status field with an approver recorded,
 * NOT real cryptographic signing. Same deliberate scope-cut precedent as
 * HrPolicyDocument's own acknowledgment feature.
 *
 * version/supersedes_document_id give simple linear version control: a
 * new upload replacing an old one sets supersedes_document_id to the
 * previous document's id and increments version — no branching, just a
 * chain, sufficient for "which is the current version" queries.
 */
@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ type: 'enum', enum: DocumentCategory })
  category: DocumentCategory;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('uuid', { nullable: true })
  related_student_id?: string | null;

  @Column('uuid', { nullable: true })
  related_employee_id?: string | null;

  @Column()
  file_path: string;

  @Column()
  original_filename: string;

  @Column()
  mime_type: string;

  @Column('int')
  file_size: number;

  @Column('int', { default: 1 })
  version: number;

  @Column('uuid', { nullable: true })
  supersedes_document_id?: string | null;

  @Column({ type: 'enum', enum: DocumentApprovalStatus, default: DocumentApprovalStatus.APPROVED })
  approval_status: DocumentApprovalStatus;

  @Column('uuid', { nullable: true })
  approved_by?: string | null;

  @Column('uuid')
  uploaded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
