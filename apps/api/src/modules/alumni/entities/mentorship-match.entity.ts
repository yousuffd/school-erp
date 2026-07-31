import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MentorshipMatchStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/** Blueprint Part 2, Module 23 — "Networking & mentorship matching": mentor_alumni_id (an alumnus) paired with mentee_student_id (a current student). */
@Entity('mentorship_matches')
export class MentorshipMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  mentor_alumni_id: string;

  @Column('uuid')
  mentee_student_id: string;

  @Column({ type: 'enum', enum: MentorshipMatchStatus, default: MentorshipMatchStatus.ACTIVE })
  status: MentorshipMatchStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
