import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Lecture } from './lecture.entity';

/**
 * "Course-progress tracking" (Blueprint core feature) scoped down to its
 * simplest honest form: a student marked this lecture as watched, or they
 * didn't. NOT tracking playback position/percentage-watched — that needs
 * client-side video-event wiring and is a meaningfully bigger feature,
 * deferred same as everything else in the "deliberately simplified" list.
 */
@Entity('lecture_progress')
@Index(['tenant_id', 'lecture_id', 'student_id'], { unique: true })
export class LectureProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  lecture_id: string;

  @ManyToOne(() => Lecture, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: Lecture;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  watched_at: Date;
}
