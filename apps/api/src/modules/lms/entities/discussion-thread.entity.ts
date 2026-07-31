import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A discussion topic, scoped to one subject+class (Blueprint Module 6 —
 * discussion forums). Thread creation is staff-only (Teacher/Admin) —
 * same "who creates the container vs who participates" split as
 * Assignments/Lectures/Resources. Students participate via posts, not by
 * starting new threads — a deliberate v1 simplification, not a technical
 * limitation; easy to loosen later if it turns out students want to start
 * their own topics.
 */
@Entity('discussion_threads')
export class DiscussionThread {
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

  @Column({ length: 150 })
  title: string;

  @Column('uuid')
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
