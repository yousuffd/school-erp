import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

/**
 * A recorded payment against a fee assignment — manual entry only. No
 * payment gateway integration (Stripe/Razorpay) here; the blueprint itself
 * calls that an optional/advanced layer, and it's a real external-integration
 * project in its own right, not something to bolt on as a side effect of
 * building the core fee structure.
 */
@Entity('fee_payments')
export class FeePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  fee_assignment_id: string;

  /** Optional — a payment can be recorded against a specific installment, or as a general payment toward the whole assignment. */
  @Column('uuid', { nullable: true })
  fee_installment_id?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'date' })
  payment_date: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ length: 100, nullable: true })
  reference_number?: string;

  @Column('uuid')
  recorded_by: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;
}
