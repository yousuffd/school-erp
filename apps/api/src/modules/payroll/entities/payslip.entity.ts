import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * pf/esi/professional_tax computed by PayrollRunsService.process() per the
 * documented statutory rules (PF: 12%/12% on basic, no wage-ceiling cap;
 * ESI: 0.75%/3.25% only if gross <= 21000; PT: flat tenant-configured
 * amount from PayrollSettings). TDS/income-tax is NOT modeled — deliberate
 * scope cut, not an omission.
 */
@Entity('payslips')
@Index(['payroll_run_id', 'employee_id'], { unique: true })
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  payroll_run_id: string;

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

  @Column({ type: 'numeric' })
  gross_salary: string;

  @Column({ type: 'numeric', default: 0 })
  pf_employee: string;

  @Column({ type: 'numeric', default: 0 })
  pf_employer: string;

  @Column({ type: 'numeric', default: 0 })
  esi_employee: string;

  @Column({ type: 'numeric', default: 0 })
  esi_employer: string;

  @Column({ type: 'numeric', default: 0 })
  professional_tax: string;

  @Column({ type: 'numeric', default: 0 })
  bonuses: string;

  @Column({ type: 'numeric', default: 0 })
  overtime: string;

  @Column({ type: 'numeric', default: 0 })
  reimbursements: string;

  @Column({ type: 'numeric', default: 0 })
  loan_deduction: string;

  @Column({ type: 'numeric' })
  net_salary: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}