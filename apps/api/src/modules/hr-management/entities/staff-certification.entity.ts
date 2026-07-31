import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Renewal alerts (blueprint core feature) are computed from expiry_date at
 * query time (findExpiringSoon(tenantId, daysAhead) in the service), not a
 * stored boolean — avoids a flag going stale without a scheduled job to
 * flip it.
 */
@Entity('staff_certifications')
export class StaffCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  employee_id: string;

  @Column({ length: 150 })
  certification_name: string;

  @Column({ type: 'date' })
  issued_date: string;

  @Column({ type: 'date', nullable: true })
  expiry_date?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}