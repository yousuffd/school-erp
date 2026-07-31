import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One student's result for one exam. marks_obtained is nullable — a null
 * means the student was absent for this exam, distinct from a genuine 0.
 */
@Entity('exam_results')
@Index(['tenant_id', 'exam_id', 'student_id'], { unique: true })
export class ExamResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  exam_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  marks_obtained?: string;

  @Column('uuid')
  entered_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
