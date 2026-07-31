import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** A single uploaded resource/note (Blueprint Module 6 — Notes/learning-resource repository). */
@Entity('learning_resources')
export class LearningResource {
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

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 500 })
  file_path: string;

  @Column({ length: 255 })
  original_filename: string;

  @Column({ length: 100 })
  mime_type: string;

  @Column('int')
  file_size: number;

  @Column('uuid')
  uploaded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
