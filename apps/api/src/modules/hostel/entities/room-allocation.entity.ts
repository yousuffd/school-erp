import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum RoomAllocationStatus {
  ACTIVE = 'active',
  VACATED = 'vacated',
}

/**
 * Room capacity is enforced in RoomAllocationsService.create(), not at the
 * DB level — same convention as Transportation's route/vehicle 409
 * double-booking guard and Cafeteria's duplicate-daily-menu 400 guard:
 * count ACTIVE allocations for the room, reject with 400 if at capacity.
 */
@Entity('hostel_room_allocations')
export class RoomAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  room_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  academic_year_id: string;

  @Column({ type: 'date' })
  allocated_date: string;

  @Column({ type: 'date', nullable: true })
  vacated_date?: string;

  @Column({ type: 'enum', enum: RoomAllocationStatus, default: RoomAllocationStatus.ACTIVE })
  status: RoomAllocationStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}