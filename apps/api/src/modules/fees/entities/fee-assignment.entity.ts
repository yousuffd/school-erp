import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Links a student to a fee structure — "this student owes this fee
 * structure's amounts for this year." Deliberately does NOT snapshot
 * component/installment amounts at assignment time (unlike, say, Admission
 * -> Student, which does copy fields over) — fee structures are read live
 * from the template, so an admin correcting a typo'd fee amount fixes it for
 * everyone already assigned too. This is a real, intentional tradeoff: if a
 * school genuinely needs to lock in historical amounts even after future
 * template edits, that's a follow-up worth its own design pass, not
 * something to guess at now.
 */
@Entity('fee_assignments')
@Index(['tenant_id', 'student_id', 'fee_structure_id'], { unique: true })
export class FeeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  fee_structure_id: string;

  @Column('uuid')
  academic_year_id: string;

  @CreateDateColumn()
  assigned_at: Date;
}
