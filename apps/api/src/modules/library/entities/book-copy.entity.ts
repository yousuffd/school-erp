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

import { Book } from './book.entity';

export enum BookCopyStatus {
  AVAILABLE = 'available',
  ISSUED = 'issued',
  RESERVED = 'reserved',
  LOST = 'lost',
  UNDER_REPAIR = 'under_repair',
}

/**
 * A single physical, barcoded copy of a Book (Blueprint Part 2, Module 12).
 * campus_id exists because a multi-campus tenant's copies physically live
 * at one campus — same pattern as Student.campus_id.
 */
@Entity('book_copies')
@Index(['tenant_id', 'barcode'], { unique: true })
export class BookCopy {
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
  campus_id: string;

  @Column({ length: 50 })
  barcode: string;

  @Column({ type: 'enum', enum: BookCopyStatus, default: BookCopyStatus.AVAILABLE })
  status: BookCopyStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
