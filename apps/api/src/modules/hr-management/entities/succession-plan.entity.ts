import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReadinessLevel {
  READY_NOW = 'ready_now',
  READY_1_2_YEARS = 'ready_1_2_years',
  DEVELOPING = 'developing',
}

@Entity('succession_plans')
export class SuccessionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  position_employee_id: string;

  @Column('uuid', { nullable: true })
  successor_employee_id?: string;

  @Column({ type: 'enum', enum: ReadinessLevel, nullable: true })
  readiness_level?: ReadinessLevel;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}