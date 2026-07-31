import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum LoanAdvanceStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('loan_advances')
export class LoanAdvance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  employee_id: string;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ type: 'numeric' })
  monthly_recovery_amount: string;

  @Column({ type: 'numeric' })
  remaining_balance: string;

  @Column({ type: 'enum', enum: LoanAdvanceStatus, default: LoanAdvanceStatus.ACTIVE })
  status: LoanAdvanceStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}