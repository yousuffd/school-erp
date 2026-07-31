import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MaintenanceRequestStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

@Entity('hostel_maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  room_id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: MaintenanceRequestStatus, default: MaintenanceRequestStatus.OPEN })
  status: MaintenanceRequestStatus;

  @Column('uuid')
  reported_by: string;

  @Column({ type: 'date' })
  reported_date: string;

  @Column({ type: 'date', nullable: true })
  resolved_date?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}