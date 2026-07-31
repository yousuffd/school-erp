import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ExamGroup } from './exam-group.entity';

/**
 * A single exam/test (Blueprint Part 2, Module 5). Phase 2 first cut is
 * internal exams only — online/external/board exam types, question banks,
 * and invigilation planning are genuinely separate features, not included.
 */
@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  subject_id: string;

  @Column('uuid')
  school_class_id: string;

  @Column('uuid')
  academic_year_id: string;

  /** e.g. "Mid-Term Exam", "Unit Test 2" */
  @Column({ length: 150 })
  name: string;

  @Column({ type: 'date' })
  exam_date: string;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  max_marks: string;

  @Column('uuid')
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ name: 'exam_group_id', nullable: true, type: 'uuid' })
  exam_group_id: string | null;

  @ManyToOne(() => ExamGroup, (group) => group.exams, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'exam_group_id' })
  exam_group: ExamGroup | null;

}
