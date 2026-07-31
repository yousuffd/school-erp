import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * pass_code + verified are the Advanced/Premium "digital visitor pass"
 * feature — a software-only layer (a generated code + a manual verification
 * flag), no physical gate hardware/ID-scanner SDK integration assumed.
 */
@Entity('hostel_visitors')
export class HostelVisitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ length: 150 })
  visitor_name: string;

  @Column({ length: 100 })
  relation: string;

  @Column({ type: 'text', nullable: true })
  purpose?: string;

  @Column({ length: 50, nullable: true })
  id_proof_type?: string;

  @Column({ length: 50, nullable: true })
  id_proof_number?: string;

  @Column({ type: 'timestamp' })
  check_in_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  @Column({ length: 20, nullable: true })
  pass_code?: string;

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}