import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RequiredPermission } from '../../../common/decorators/permissions.decorator';

export enum SystemRoleName {
  SUPER_ADMIN = 'Super Admin',
  DISTRICT_ADMIN = 'District/Trust Admin',
  SCHOOL_ADMIN = 'School Admin',
  TEACHER = 'Teacher',
  PARENT = 'Parent',
  STUDENT = 'Student',
  HOSTEL_ADMIN = 'Hostel Admin',
  HR_MANAGER = 'HR Manager',
  PAYROLL_ADMIN = 'Payroll Admin',
  LIBRARY_ADMIN = 'Library Admin',
  TRANSPORTATION_ADMIN = 'Transportation Admin',
  CAFETERIA_ADMIN = 'Cafeteria Admin',
  ACTIVITY_COORDINATOR = 'Activity Coordinator',
  COUNSELOR = 'Counselor',
}

/**
 * Roles are tenant-scoped (except the platform Super Admin, which uses a
 * reserved tenant_id of null). `permissions` is stored as jsonb — a denormalized
 * copy of granted (module, action) pairs, per Blueprint §5.3 ("jsonb or join table").
 * We chose jsonb for Phase 0 to keep the permission-check hot path a single read;
 * a normalized join table is a straightforward migration later if per-permission
 * auditing/versioning is needed (documented in PROGRESS.md as a deviation to review).
 */
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  tenant_id: string | null;

  @Column({ length: 100 })
  name: string;

  @Column({ default: false })
  is_system_role: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  permissions: RequiredPermission[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
