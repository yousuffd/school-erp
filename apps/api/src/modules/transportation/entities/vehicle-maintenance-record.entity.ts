import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
}

export enum MaintenanceRecordStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

@Entity('vehicle_maintenance_records')
export class VehicleMaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  vehicle_id: string;

  @Column({ type: 'enum', enum: MaintenanceType })
  maintenance_type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  scheduled_date: string;

  @Column({ type: 'date', nullable: true })
  completed_date?: string;

  @Column({ type: 'numeric', nullable: true })
  cost?: string;

  @Column({ length: 200, nullable: true })
  vendor_name?: string;

  @Column({ type: 'enum', enum: MaintenanceRecordStatus, default: MaintenanceRecordStatus.SCHEDULED })
  status: MaintenanceRecordStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}