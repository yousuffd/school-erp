import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';
import { Exam } from './exam.entity';

/**
 * ExamGroup — represents one "scheduling session" (e.g. "Mid-Term — Term 1,
 * 2026-27") in which a coordinator creates exams for several subjects across
 * several classes/sections in a single action.
 *
 * Matches the Exam entity's convention: explicit tenant_id uuid column
 * (RLS enforced on top of it), snake_case property names throughout.
 */
@Entity('exam_groups')
export class ExamGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  academic_year_id: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academic_year: AcademicYear;

  @Column({ length: 150 })
  name: string; // e.g. "Mid-Term — Term 1"

  @OneToMany(() => Exam, (exam) => exam.exam_group)
  exams: Exam[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
