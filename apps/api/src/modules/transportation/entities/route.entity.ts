import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A bus route (Blueprint Part 2, Module 13 — "Route & stop planning").
 * Stops belong to a route via RouteStop; vehicle/driver assignment is a
 * separate RouteAssignment — a route's vehicle/driver can change between
 * academic years without losing the route/stop definitions themselves.
 */
@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
