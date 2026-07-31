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

/**
 * A stop on a Route, in sequence order (Blueprint Part 2, Module 13 —
 * "Route & stop planning"). latitude/longitude are the stop's STATIC
 * location, not a live vehicle position — live GPS tracking is a
 * separate, entirely deferred feature (see vehicle.entity.ts).
 */
@Entity('route_stops')
@Index(['tenant_id', 'route_id', 'sequence_order'], { unique: true })
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  route_id: string;

  @ManyToOne(() => Route, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'int' })
  sequence_order: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitude?: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitude?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
