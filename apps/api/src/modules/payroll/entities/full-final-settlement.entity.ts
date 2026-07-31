import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SettlementStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
}

/**
 * dues/deductions are entered manually by Payroll Admin, not auto-computed
 * from anything (unlike PayrollRun's payslip generation) — full & final
 * settlement involves case-specific items (unused leave encashment,
 * pending reimbursements, notice-period deductions, etc.) with no single
 * formula, deliberately left as plain entered figures rather than a
 * fabricated calculation.
 */
@Entity('full_final_settlements')
export class FullFinalSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  employee_id: string;

  @Column({ type: 'date' })
  last_working_date: string;

  @Column({ type: 'numeric', default: 0 })
  dues: string;

  @Column({ type: 'numeric', default: 0 })
  deductions: string;

  @Column({ type: 'numeric' })
  net_settlement_amount: string;

  @Column({ type: 'enum', enum: SettlementStatus, default: SettlementStatus.PENDING })
  status: SettlementStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}