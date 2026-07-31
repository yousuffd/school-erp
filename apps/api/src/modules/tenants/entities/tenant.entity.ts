import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Campus } from '../../campuses/entities/campus.entity';

export enum TenantStatus {
  PROVISIONING = 'provisioning',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  OFFBOARDED = 'offboarded',
}

/**
 * The root of multi-tenancy. Every other entity is scoped to a tenant_id
 * (directly or via a parent relation) and Postgres RLS policies key off this.
 * Fields per Blueprint §5.3 / Phase 0 kickoff §3.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  school_name: string;

  @Column({ unique: true, length: 63 })
  subdomain: string;

  @Column({ nullable: true })
  logo_url?: string;

  @Column({ length: 7, default: '#0D9488' })
  primary_color: string;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.PROVISIONING })
  status: TenantStatus;

  @OneToMany(() => Campus, (campus) => campus.tenant)
  campuses: Campus[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
