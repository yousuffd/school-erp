import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StudentLifecycleStatus {
  ENROLLED = 'enrolled', // admitted, not yet active (e.g. before term start)
  ACTIVE = 'active',
  TRANSFERRED = 'transferred',
  WITHDRAWN = 'withdrawn',
  GRADUATED = 'graduated',
  ALUMNI = 'alumni',
  /**
   * Flags a record that was created by mistake (duplicate entry, wrong
   * person entirely) — a non-destructive alternative to actually deleting
   * the row. Preserves the record (and its history/references) for audit
   * purposes while excluding it from active rosters, attendance, etc.
   * Reversible, same as withdrawn, in case something was flagged in error.
   */
  DUPLICATE = 'duplicate',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

/**
 * Core 360° student profile (Blueprint Part 2, Module 3 — Student Lifecycle
 * Management). Phase 1 first cut: the fields here cover what's usable without
 * modules that don't exist yet.
 *
 * Deliberately NOT included yet (needs other modules first, per blueprint's
 * own dependency list — "Admissions, Academic Management, Attendance, Fee,
 * Discipline"):
 *   - Formal Class/Section entities (Academic Management, not yet built) —
 *     grade_level/section are plain strings for now, a known simplification
 *     to revisit once Academic Management ships its own Class/Section model.
 *   - Transport/hostel linkage, awards/clubs, document repository — those
 *     modules don't exist yet either.
 *   - ID card generation — a template/PDF generation feature in its own
 *     right, deferred to a later Phase 1 increment.
 */
@Entity('students')
@Index(['tenant_id', 'admission_number'], { unique: true })
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  campus_id: string;

  /** Human-facing ID, e.g. "ADM-2026-0001" — shown in the mono font per DESIGN_SYSTEM.md §3. */
  @Column({ length: 40 })
  admission_number: string;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ type: 'date' })
  date_of_birth: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.PREFER_NOT_TO_SAY })
  gender: Gender;

  /** Plain string until Academic Management ships formal Class/Section entities. */
  @Column({ length: 40 })
  grade_level: string;

  @Column({ length: 20, nullable: true })
  section?: string;

  /**
   * Links to a formal SchoolClass (Academic Management module). Nullable —
   * a student can legitimately exist without a class assignment yet (e.g.
   * freshly enrolled, not yet sectioned). This is the retrofit flagged as a
   * follow-up when SchoolClass was first built; it's being done now because
   * Attendance genuinely can't build a sensible class roster without it.
   */
  @Column('uuid', { nullable: true })
  school_class_id?: string;

  /**
   * Auto-assigned only (never accepted from a client — see StudentsService)
   * — the next sequential number within this student's class. Recomputed
   * whenever a student is (re)assigned to a class, since roll number is
   * scoped to "this class this year," not a permanent student attribute
   * like admission_number.
   */
  @Column({ type: 'int', nullable: true })
  roll_number?: number;

  @Column('uuid')
  academic_year_id: string;

  @Column({ type: 'enum', enum: StudentLifecycleStatus, default: StudentLifecycleStatus.ENROLLED })
  status: StudentLifecycleStatus;

  @Column({ type: 'date' })
  enrollment_date: string;

  @Column({ length: 150 })
  guardian_name: string;

  @Column({ length: 32 })
  guardian_phone: string;

  @Column({ length: 254, nullable: true })
  guardian_email?: string;

  @Column({ length: 150, nullable: true })
  emergency_contact_name?: string;

  @Column({ length: 32, nullable: true })
  emergency_contact_phone?: string;

  @Column({ type: 'text', nullable: true })
  medical_notes?: string;

  @Column({ nullable: true })
  photo_url?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
