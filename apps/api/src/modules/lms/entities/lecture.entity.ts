import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A single uploaded lecture video (Blueprint Module 6 — recorded lecture
 * library / video library with access control). Real file uploads, per
 * decision — not external links. No duration/transcoding metadata
 * extracted server-side (would need ffmpeg or similar); deferred.
 */
@Entity('lectures')
export class Lecture {
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
  video_path: string;

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
