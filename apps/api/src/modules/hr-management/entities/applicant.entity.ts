import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ApplicantStage {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFERED = 'offered',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

@Entity('applicants')
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  job_opening_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 254 })
  email: string;

  @Column({ length: 32, nullable: true })
  phone?: string;

  @Column({ nullable: true })
  resume_url?: string;

  @Column({ type: 'enum', enum: ApplicantStage, default: ApplicantStage.APPLIED })
  stage: ApplicantStage;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}