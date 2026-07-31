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
import { RouteStop } from './route-stop.entity';

/**
 * Links a Student to their assigned Route + boarding Stop for an academic
 * year (Blueprint Part 2, Module 13). One active transport assignment per
 * student per year — a student switching routes mid-year updates this
 * row in place (via a dedicated reassignment action), not modeled as a
 * history table.
 */
@Entity('student_transport_assignments')
@Index(['tenant_id', 'student_id', 'academic_year_id'], { unique: true })
export class StudentTransportAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  route_id: string;

  @ManyToOne(() => Route, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column('uuid')
  stop_id: string;

  @ManyToOne(() => RouteStop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stop_id' })
  stop: RouteStop;

  @Column('uuid')
  academic_year_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
