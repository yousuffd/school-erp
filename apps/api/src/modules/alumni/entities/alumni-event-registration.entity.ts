import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('alumni_event_registrations')
@Index(['event_id', 'alumni_id'], { unique: true })
export class AlumniEventRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  alumni_id: string;

  @CreateDateColumn()
  registered_at: Date;
}
