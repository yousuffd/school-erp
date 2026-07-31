import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Records that a student's parent has opted them OUT of school transport
 * for a given academic year (Blueprint Part 2, Module 13 follow-up).
 * A row existing = opted out; no row = eligible/assigned as normal.
 * Set by the Parent via the resolveParentOnlyStudentId-gated my-child
 * routes on TransportationController — never directly by Admin/staff.
 *
 * Deliberately a separate table rather than a column on Student, matching
 * StudentTransportAssignment's own note that transport linkage lives in
 * this module, not on the student record. Per-year granularity mirrors
 * StudentTransportAssignment's own unique index.
 */
@Entity('student_transport_opt_outs')
@Index(['tenant_id', 'student_id', 'academic_year_id'], { unique: true })
export class StudentTransportOptOut {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  academic_year_id: string;

  @CreateDateColumn()
  created_at: Date;
}
