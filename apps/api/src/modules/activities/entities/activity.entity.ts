import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ActivityCategory {
  CLUB = 'club',
  SPORT = 'sport',
  CULTURAL = 'cultural',
}

/**
 * The catalog record for an ongoing club/team/activity (Blueprint Part 2,
 * Module 21 — "Club & activity rosters"). A specific competition/fixture/
 * cultural event is a separate Event row, optionally linked back to one of
 * these via activity_id — same catalog-vs-instance split as Cafeteria's
 * MenuItem (dish) vs DailyMenu (a specific day's serving).
 */
@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: ActivityCategory })
  category: ActivityCategory;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
