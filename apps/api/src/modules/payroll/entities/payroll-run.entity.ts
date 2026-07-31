import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PayrollRunStatus {
  DRAFT = 'draft',
  PROCESSED = 'processed',
  DISBURSED = 'disbursed',
}

@Entity('payroll_runs')
@Index(['tenant_id', 'month', 'year'], { unique: true })
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'enum', enum: PayrollRunStatus, default: PayrollRunStatus.DRAFT })
  status: PayrollRunStatus;

  @Column({ type: 'date', nullable: true })
  processed_date?: string;

  @Column({ type: 'timestamp', nullable: true })
  bank_file_generated_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}