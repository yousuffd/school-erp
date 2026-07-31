import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum StaffAttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  ON_LEAVE = 'on_leave',
}

@Entity('staff_attendance_records')
@Index(['tenant_id', 'employee_id', 'date'], { unique: true })
export class StaffAttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  employee_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: StaffAttendanceStatus })
  status: StaffAttendanceStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}