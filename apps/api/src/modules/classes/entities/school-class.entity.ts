import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A formal "Grade 5 - A" record (Blueprint calls this a class/section
 * grouping). This is deliberately a NEW, separate entity from the plain
 * `grade_level`/`section` strings already sitting on Student — retrofitting
 * Student to reference this via a foreign key is real data-migration work
 * (matching existing students to a class, or creating classes to match them)
 * and is intentionally NOT done in this pass. This entity is additive only
 * for now; linking it up is a tracked follow-up.
 */
@Entity('school_classes')
@Index(['tenant_id', 'academic_year_id', 'grade_level', 'section'], { unique: true })
export class SchoolClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  campus_id: string;

  @Column('uuid')
  academic_year_id: string;

  @Column({ length: 40 })
  grade_level: string;

  @Column({ length: 20, nullable: true })
  section?: string;

  /** The homeroom/lead teacher for this class — nullable since it may not be assigned yet. */
  @Column('uuid', { nullable: true })
  class_teacher_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
