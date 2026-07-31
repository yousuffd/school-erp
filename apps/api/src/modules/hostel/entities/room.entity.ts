import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  DORMITORY = 'dormitory',
}

@Entity('hostel_rooms')
@Index(['tenant_id', 'campus_id', 'building_name', 'room_number'], { unique: true })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  campus_id: string;

  @Column({ length: 100 })
  building_name: string;

  @Column({ length: 20 })
  room_number: string;

  @Column({ type: 'int', nullable: true })
  floor?: number;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.DOUBLE })
  room_type: RoomType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}