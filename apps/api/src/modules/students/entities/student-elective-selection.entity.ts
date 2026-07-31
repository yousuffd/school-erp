import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A student's chosen elective — a PERMANENT choice for their whole time at
 * the school, not scoped to any one academic year (reversed from the
 * original session 27-28 per-year design once the actual intent was
 * clarified: an elective GROUP like "Language" is meant to be a single
 * standing choice, not something re-picked every year). Only one row per
 * (student, elective_group) is ever created in normal operation — enforced
 * in StudentElectiveSelectionsService.findExistingInGroup, which checks
 * across the student's ENTIRE selection history now, not one year at a
 * time. academic_year_id is retained purely as a historical record of
 * when the choice was originally made; it is not used as a lookup key
 * anywhere.
 *
 * Locked-in-once-selected is still an APPLICATION rule, not a DB
 * constraint - an Admin-only route (adminSet) can still override it.
 * Likewise "only one selection per elective_group" can't be a DB
 * constraint since elective_group lives on Subject, not here - also
 * checked in the service.
 */
@Entity('student_elective_selections')
@Index(['tenant_id', 'student_id', 'subject_id', 'academic_year_id'], { unique: true })
export class StudentElectiveSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  subject_id: string;

  @Column('uuid')
  academic_year_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}