import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

/**
 * user_id lives here (not on User — see session discussion) rather than
 * following User.student_id's outward-pointing convention, specifically to
 * avoid touching the stable, heavily-depended-on users table for a new
 * module. manager_id is self-referencing and feeds the org-chart
 * (Advanced/Premium) — a simple nested-tree render client-side, no new
 * dependency. base_salary is a plain field, same "record it, don't
 * integrate it" convention as Inventory's AssetTag.purchase_cost before
 * Finance & Accounting exists — no live Payroll link yet.
 */
@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid', { nullable: true })
  user_id?: string;

  @Column('uuid', { nullable: true })
  manager_id?: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 254 })
  email: string;

  @Column({ length: 100 })
  department: string;

  @Column({ length: 100 })
  designation: string;

  @Column({ type: 'enum', enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employment_type: EmploymentType;

  @Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  @Column({ type: 'date' })
  date_of_joining: string;

  @Column({ type: 'date', nullable: true })
  contract_end_date?: string;

  @Column({ type: 'numeric', nullable: true })
  base_salary?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}