import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * bank_account_number/ifsc_code/account_holder_name live here rather than
 * on Employee (HR's already-shipped table) — see session design discussion.
 * Multiple rows per employee are expected over time (salary revisions);
 * the "current" structure is whichever has the latest effective_from that
 * is <= today, resolved in the service layer, not enforced by a unique
 * constraint here.
 */
@Entity('salary_structures')
export class SalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  employee_id: string;

  @Column({ type: 'numeric' })
  basic_salary: string;

  @Column({ type: 'numeric', default: 0 })
  hra: string;

  @Column({ type: 'numeric', default: 0 })
  special_allowance: string;

  @Column({ type: 'numeric', default: 0 })
  other_allowances: string;

  @Column({ type: 'date' })
  effective_from: string;

  @Column({ length: 50, nullable: true })
  bank_account_number?: string;

  @Column({ length: 20, nullable: true })
  bank_ifsc_code?: string;

  @Column({ length: 200, nullable: true })
  bank_account_holder_name?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}