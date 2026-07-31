import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum JobOpeningStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('job_openings')
export class JobOpening {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 100 })
  department: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: JobOpeningStatus, default: JobOpeningStatus.OPEN })
  status: JobOpeningStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}