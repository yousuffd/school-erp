import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * A standalone driver profile (Blueprint Part 2, Module 13 — "Driver &
 * attendant management"). Deliberately NOT linked to a User/login — same
 * precedent as Student predating User linkage. A Driver login (e.g.
 * self-service route/schedule view) is a separate feature, not requested
 * for this pass.
 */
@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 50 })
  license_number: string;

  @Column({ length: 32 })
  phone: string;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.ACTIVE })
  status: DriverStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
