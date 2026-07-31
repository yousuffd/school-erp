import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DiscussionThread } from './discussion-thread.entity';

/**
 * One reply in a thread. author_id is always the poster's own userId (not
 * student_id) — a post can come from Teacher/Admin (staff permission) or a
 * Student (ownership-checked against the thread's class), so this can't be
 * student-specific the way AssignmentSubmission is.
 */
@Entity('discussion_posts')
export class DiscussionPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  thread_id: string;

  @ManyToOne(() => DiscussionThread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread: DiscussionThread;

  @Column('uuid')
  author_id: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
