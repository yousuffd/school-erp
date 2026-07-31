import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum HostelAttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  ON_LEAVE = 'on_leave',
}

@Entity('hostel_attendance_records')
@Index(['tenant_id', 'student_id', 'date'], { unique: true })
export class HostelAttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: HostelAttendanceStatus })
  status: HostelAttendanceStatus;

  @Column({ type: 'time', nullable: true })
  curfew_check_in_time?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}