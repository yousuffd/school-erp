import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum EventType {
  COMPETITION = 'competition',
  CULTURAL = 'cultural',
  FIXTURE = 'fixture',
}

export enum FixtureResult {
  WIN = 'win',
  LOSS = 'loss',
  DRAW = 'draw',
}

/**
 * A specific dated competition/cultural event/sports fixture (Blueprint
 * Part 2, Module 21 — "Competition & event registration", "Cultural-event
 * management", "Sports team & fixture management"). activity_id is
 * nullable since some events (a one-off inter-school quiz, say) aren't
 * tied to any ongoing club/team.
 *
 * opponent_name/our_score/opponent_score/result are only ever populated
 * when event_type = FIXTURE — kept as nullable columns on this one table
 * rather than a separate FixtureResult table, matching the project's
 * existing convention for type-specific fields (e.g. Exam.exam_group_id).
 */
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid', { nullable: true })
  activity_id?: string | null;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: EventType })
  event_type: EventType;

  @Column({ type: 'date' })
  event_date: string;

  @Column({ length: 200, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  opponent_name?: string | null;

  @Column({ type: 'int', nullable: true })
  our_score?: number | null;

  @Column({ type: 'int', nullable: true })
  opponent_score?: number | null;

  @Column({ type: 'enum', enum: FixtureResult, nullable: true })
  result?: FixtureResult | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
