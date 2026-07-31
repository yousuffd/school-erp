import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** A student's sign-up for a specific event. */
@Entity('event_registrations')
@Index(['event_id', 'student_id'], { unique: true })
export class EventRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  student_id: string;

  @CreateDateColumn()
  registered_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
