import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A catalog title (Blueprint Part 2, Module 12 — Library Management).
 * This is the bibliographic record, NOT a physical/borrowable item — see
 * BookCopy for that. A single Book can have many BookCopy rows (multiple
 * physical/barcoded copies on the shelf).
 *
 * Deliberately NOT included this pass (Phase 3 first cut, digital library
 * kept out of scope per kickoff discussion):
 *   - Digital library / e-book access (needs file storage/S3 — a separate
 *     concern, revisit if/when that's actually prioritized).
 *   - Reading-level/interest-based recommendation engine (Advanced/Premium
 *     tier per blueprint, not MVP).
 */
@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 300 })
  title: string;

  @Column({ length: 200 })
  author: string;

  /** Not enforced unique — real-world catalogs have multi-copy/edition ISBN collisions and reprints without one. */
  @Column({ length: 20, nullable: true })
  isbn?: string;

  @Column({ length: 100, nullable: true })
  category?: string;

  @Column({ length: 150, nullable: true })
  publisher?: string;

  @Column({ length: 50, nullable: true })
  edition?: string;

  @Column({ nullable: true })
  cover_url?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
