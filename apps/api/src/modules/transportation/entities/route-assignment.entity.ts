import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Route } from './route.entity';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';

/**
 * Assigns one Vehicle + one Driver to a Route for a given academic year
 * (Blueprint Part 2, Module 13 — "Bus/vehicle allocation"). v1
 * simplification: exactly one active assignment per (route, academic
 * year) — a route running separate morning/afternoon vehicles isn't
 * modeled yet, documented as a known follow-up rather than built in.
 */
@Entity('route_assignments')
@Index(['tenant_id', 'route_id', 'academic_year_id'], { unique: true })
export class RouteAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  route_id: string;

  @ManyToOne(() => Route, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column('uuid')
  vehicle_id: string;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column('uuid')
  driver_id: string;

  @ManyToOne(() => Driver, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column('uuid')
  academic_year_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
