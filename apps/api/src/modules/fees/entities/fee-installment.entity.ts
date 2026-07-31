import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FeeStructure } from './fee-structure.entity';

/**
 * One term/installment within a fee structure's payment plan, e.g.
 * "Term 1" due 2026-06-15 for ₹15,000. The sum of a structure's installment
 * amounts is expected to equal the sum of its component amounts (validated
 * at creation time, not just assumed).
 */
@Entity('fee_installments')
export class FeeInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  fee_structure_id: string;

  @ManyToOne(() => FeeStructure, (s) => s.installments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_structure_id' })
  fee_structure: FeeStructure;

  /** e.g. "Term 1" */
  @Column({ length: 60 })
  label: string;

  @Column({ type: 'date' })
  due_date: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;
}
