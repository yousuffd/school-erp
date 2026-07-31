import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentMode {
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  CHEQUE = 'cheque',
  INVOICE = 'invoice',
  OTHER = 'other',
}

/**
 * Manually-recorded payment entries — no payment gateway integration yet
 * (SUPER_ADMIN_DASHBOARD_SCOPE.md §5: "simple manual field", confirmed).
 * A Super Admin records these by hand after receiving payment through
 * whatever channel the tenant actually used.
 */
@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ type: 'enum', enum: PaymentMode })
  payment_mode: PaymentMode;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ type: 'date' })
  payment_date: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('uuid', { nullable: true })
  recorded_by?: string | null;

  /**
   * Payments are never hard-edited or hard-deleted (decided this session)
   * — voiding preserves the original entry for audit purposes. A "correction"
   * is void-the-old-one + record-a-new-one, not an in-place edit.
   */
  @Column({ type: 'timestamptz', nullable: true })
  voided_at?: Date | null;

  @Column('uuid', { nullable: true })
  voided_by?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
