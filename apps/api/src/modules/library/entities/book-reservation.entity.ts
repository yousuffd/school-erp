import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from './book.entity';
import { BookCopy } from './book-copy.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

/**
 * A Student's request for a Book title when no copy is currently available
 * (Blueprint Part 2, Module 12 — reservations). Reserves the TITLE, not a
 * specific BookCopy — which physical copy fulfills it is decided at
 * fulfillment time (whichever copy is returned/available first).
 */
@Entity('book_reservations')
export class BookReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  book_id: string;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  /** Set only once fulfilled — which specific copy was handed over. */
  @Column('uuid', { nullable: true })
  fulfilled_book_copy_id?: string;

  @ManyToOne(() => BookCopy, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fulfilled_book_copy_id' })
  fulfilled_book_copy?: BookCopy | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
