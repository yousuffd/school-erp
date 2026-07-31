import { RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../entities/role.entity';

/**
 * Phase 4 permissions. First module: HR Management (Module 10). Payroll and
 * Finance & Accounting will each get their own block added here as they're
 * built, following the same pattern phase3-permission-matrix.ts established
 * for consolidating multiple modules from one phase into one file.
 */
const ALL_ACTIONS: RequiredPermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];

const fullAccess = (module: string): RequiredPermission[] =>
  ALL_ACTIONS.map((action) => ({ module, action }));

// ============================================================
// HR Management (Module 10)
// ============================================================
// HR Manager is a new dedicated system role (blueprint names HR Manager,
// Principal, Employee, Recruiter as this module's roles — Principal maps to
// existing School Admin, Employee is ownership-scoping onto whichever role a
// staff member already has, not a new login role, and Recruiter isn't
// distinguished from HR Manager for now, same "don't split roles until the
// workflow needs it" reasoning as Admissions Officer). School/District Admin
// also get full access, matching every other module's admin-oversight
// precedent. No grant to Student Lifecycle or any other module.
const HR_MANAGEMENT_MODULE = 'hr-management';
const HR_MANAGEMENT_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(HR_MANAGEMENT_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(HR_MANAGEMENT_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(HR_MANAGEMENT_MODULE),
  [SystemRoleName.HR_MANAGER]: fullAccess(HR_MANAGEMENT_MODULE),
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

// ============================================================
// Payroll (Module 11)
// ============================================================
const PAYROLL_MODULE = 'payroll';
const PAYROLL_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: fullAccess(PAYROLL_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(PAYROLL_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(PAYROLL_MODULE),
  [SystemRoleName.PAYROLL_ADMIN]: fullAccess(PAYROLL_MODULE),
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};


// ============================================================
// Combined export
// ============================================================
function mergeByRole(
  ...matrices: Record<SystemRoleName, RequiredPermission[]>[]
): Record<SystemRoleName, RequiredPermission[]> {
  const result = {} as Record<SystemRoleName, RequiredPermission[]>;
  for (const name of Object.values(SystemRoleName)) {
    result[name] = matrices.flatMap((m) => m[name]);
  }
  return result;
}

export const PHASE_4_ROLE_PERMISSIONS = mergeByRole(HR_MANAGEMENT_PERMISSIONS, PAYROLL_PERMISSIONS);