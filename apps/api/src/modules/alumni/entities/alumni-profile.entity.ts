import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Blueprint Part 2, Module 23 — "Alumni directory & profile conversion at
 * graduation". Links back to the original Student record via student_id
 * (Student.status already has an 'alumni' value — this is the profile
 * created alongside that status change, not a replacement for the
 * Student record itself). Unique on (tenant, student) — one alumni
 * profile per former student, created once.
 */
@Entity('alumni_profiles')
@Index(['tenant_id', 'student_id'], { unique: true })
export class AlumniProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('int')
  graduation_year: number;

  @Column({ length: 150, nullable: true })
  current_occupation?: string;

  @Column({ length: 150, nullable: true })
  current_employer?: string;

  @Column({ length: 100, nullable: true })
  current_city?: string;

  @Column({ length: 254, nullable: true })
  contact_email?: string;

  @Column({ length: 32, nullable: true })
  contact_phone?: string;

  @Column({ length: 300, nullable: true })
  linkedin_url?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
