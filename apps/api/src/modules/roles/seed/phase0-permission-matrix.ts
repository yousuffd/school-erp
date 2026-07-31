import { RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../entities/role.entity';

/**
 * Encodes the Phase 0 RBAC Matrix from PHASE_0_KICKOFF.md §4.
 * Modules here are limited to what exists in Phase 0 (core-admin, user-management,
 * tenant-provisioning); further modules get their own permission rows as later
 * phases ship, per the "each module ships behind a feature flag" standard.
 */
const ALL_ACTIONS: RequiredPermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];
const PHASE_0_MODULES = ['core-admin', 'user-management', 'tenant-provisioning'] as const;

const fullAccess = (modules: readonly string[]): RequiredPermission[] =>
  modules.flatMap((module) => ALL_ACTIONS.map((action) => ({ module, action })));

export const PHASE_0_ROLE_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: fullAccess(['tenant-provisioning']),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(['core-admin', 'user-management']), // "Full (own tenants)"; no tenant provisioning
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(['core-admin', 'user-management']), // "Full (own campus)"
  [SystemRoleName.TEACHER]: [], // None on Core Admin / User Mgmt / Tenant Provisioning per matrix
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};
