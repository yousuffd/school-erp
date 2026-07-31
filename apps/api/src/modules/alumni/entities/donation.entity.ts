import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DonationPaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

/**
 * Blueprint Part 2, Module 23 — "Donation/giving tracking". Deliberately
 * record-keeping only, no real payment gateway integration — same
 * reminders-first/no-gateway-required precedent as Fee Management,
 * appropriate given Finance & Accounting (Module 9) is deliberately parked.
 */
@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  alumni_id: string;

  @Column('numeric')
  amount: string;

  @Column({ type: 'date' })
  donation_date: string;

  @Column({ length: 200, nullable: true })
  purpose?: string;

  @Column({ type: 'enum', enum: DonationPaymentMethod })
  payment_method: DonationPaymentMethod;

  @Column('uuid')
  recorded_by: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;
}
