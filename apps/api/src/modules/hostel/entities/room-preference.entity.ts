import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * matched_room_id is set by RoomPreferencesService.runMatching() — a real
 * but pragmatic compatibility scorer (mutual preferred_roommate_id pairing
 * + shared preferred_floor as a tiebreaker), not an ML model. Matches the
 * project's existing bar for "real but proportionate" (see the AI Timetable
 * Optimizer — a constraint solver, not a black box).
 */
@Entity('hostel_room_preferences')
export class RoomPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid', { nullable: true })
  preferred_roommate_id?: string;

  @Column({ type: 'int', nullable: true })
  preferred_floor?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('uuid', { nullable: true })
  matched_room_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}