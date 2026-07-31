import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BookCopy } from './book-copy.entity';

/**
 * One issue/return cycle for a single BookCopy (Blueprint Part 2, Module 12
 * — barcode/RFID issue-return, reservations & fines).
 *
 * student_id is required and Student-only for this pass — deliberate
 * simplification, not an oversight. Blueprint's role list for this module
 * includes staff/Teacher borrowing too, but modeling a generic borrower
 * (student OR staff) means either a nullable dual-FK or a
 * borrower_type/borrower_id polymorphic pair — a real schema decision
 * better made if/when staff borrowing is actually needed, not spent now on
 * a case with no current requirement. Flagged as a documented follow-up.
 *
 * fine_amount/fine_paid: fines are auto-calculated at return time (see
 * library/utils/fine-calculator.util.ts) at a flat tenant-wide rate for
 * this pass — per-tenant configurable rates are a follow-up, not built now.
 */
@Entity('book_issues')
@Index(['tenant_id', 'book_copy_id', 'return_date'])
export class BookIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  book_copy_id: string;

  @ManyToOne(() => BookCopy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_copy_id' })
  book_copy: BookCopy;

  @Column('uuid')
  student_id: string;

  /** Staff user who processed the issue (front desk / librarian-acting-Admin). */
  @Column('uuid')
  issued_by: string;

  @Column({ type: 'date' })
  issue_date: string;

  @Column({ type: 'date' })
  due_date: string;

  /** Null while the copy is still out. Set on return. */
  @Column({ type: 'date', nullable: true })
  return_date?: string;

  /** Staff user who processed the return — null until returned. */
  @Column('uuid', { nullable: true })
  returned_by?: string;

  /** Computed at return time from due_date vs. return_date. Null until then. */
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  fine_amount?: string;

  @Column({ default: false })
  fine_paid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
