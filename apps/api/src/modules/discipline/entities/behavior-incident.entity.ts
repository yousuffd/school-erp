import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum IncidentType {
  MERIT = 'merit',
  DEMERIT = 'demerit',
}

export enum IncidentStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

/**
 * Blueprint Part 2, Module 20 — "Incident reporting workflow" +
 * "Merit/demerit point systems" combined into one row: every recorded
 * incident carries its own point delta (positive for merit, negative for
 * demerit). A student's running points balance is deliberately NOT stored
 * as a column here — it's computed live (SUM(points) per student), same
 * "compute on read, don't cache a running total" convention already used
 * for FeeBalance, avoiding any risk of a stored total drifting out of
 * sync with the underlying incident rows.
 */
@Entity('behavior_incidents')
export class BehaviorIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  reported_by: string;

  @Column({ type: 'date' })
  incident_date: string;

  @Column({ type: 'enum', enum: IncidentType })
  incident_type: IncidentType;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
