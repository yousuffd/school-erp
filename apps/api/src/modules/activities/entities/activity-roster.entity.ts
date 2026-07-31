import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Which students belong to which ongoing activity/club/team. */
@Entity('activity_rosters')
@Index(['activity_id', 'student_id'], { unique: true })
export class ActivityRoster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  activity_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'date' })
  joined_date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
