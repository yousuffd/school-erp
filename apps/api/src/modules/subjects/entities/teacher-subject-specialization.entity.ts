import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Which single subject a teacher specializes in (Blueprint Part 2, Module 4
 * — "Timetable builder & teacher allocation"). Deliberately one row per
 * teacher (unique on tenant+teacher_id, NOT unique on subject_id) — a
 * teacher teaches exactly one subject, but a subject can have several
 * dedicated teachers each covering a different subset of classes (e.g.
 * Mathematics needs 2 teachers to cover all 10 classes within a single
 * teacher's 40-period/week cap). This is what generateSchedule's
 * requirements should be built FROM going forward, replacing the earlier
 * ad-hoc "any teacher can take any subject" assumption that let the same
 * class+subject be split across multiple rotating teachers.
 */
@Entity('teacher_subject_specializations')
@Index(['tenant_id', 'teacher_id'], { unique: true })
export class TeacherSubjectSpecialization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  teacher_id: string;

  @Column('uuid')
  subject_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}