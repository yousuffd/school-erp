import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VehicleStatus {
  ACTIVE = 'active',
  UNDER_MAINTENANCE = 'under_maintenance',
  RETIRED = 'retired',
}

/**
 * A school bus/vehicle (Blueprint Part 2, Module 13 — Transportation
 * Management). campus_id follows the same pattern as BookCopy/Student —
 * a vehicle physically operates out of one campus.
 *
 * Deliberately NOT included this pass:
 *   - Vehicle maintenance scheduling — a genuine core (MVP) feature per
 *     the blueprint, but deferred to a follow-up round per explicit
 *     decision: ship core routing/allocation first, add
 *     VehicleMaintenanceRecord after.
 *   - Live GPS tracking — needs real telemetry/hardware integration,
 *     out of scope entirely for this build.
 */
@Entity('vehicles')
@Index(['tenant_id', 'registration_number'], { unique: true })
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  campus_id: string;

  @Column({ length: 20 })
  registration_number: string;

  @Column({ length: 100, nullable: true })
  model?: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status: VehicleStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
