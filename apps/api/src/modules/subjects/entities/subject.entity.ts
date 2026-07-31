import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * The curriculum catalog (Blueprint Part 2, Module 4 — "Curriculum, subjects,
 * courses & electives mapping"). Deliberately generic per-tenant, not locked
 * to a specific grade — the Timetable is what ties a subject to a specific
 * class/section, so the same "Mathematics" subject can be taught across
 * multiple grades without duplicating the catalog entry.
 */
@Entity('subjects')
@Index(['tenant_id', 'code'], { unique: true })
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  /** Short code, e.g. "MATH", "ENG101" — shown in the mono font per DESIGN_SYSTEM.md §3. */
  @Column({ length: 20 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** Marks this subject as an elective option rather than core curriculum — see elective_group. */
  @Column({ default: false })
  is_elective: boolean;

  @Column({ length: 50, nullable: true })
  elective_group?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Added alongside 1727310000000-AddDeletedAtToSubjects.ts, so
  // repo().softDelete() in SubjectsService.remove() actually maps to a
  // real column instead of throwing at runtime.
  @DeleteDateColumn()
  deleted_at?: Date | null;
}