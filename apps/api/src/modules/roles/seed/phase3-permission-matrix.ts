import { RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../entities/role.entity';

const ALL_ACTIONS: RequiredPermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];

const fullAccess = (module: string): RequiredPermission[] =>
  ALL_ACTIONS.map((action) => ({ module, action }));

// ============================================================
// Library (Module 12)
// ============================================================
const LIBRARY_MODULE = 'library';
const LIBRARY_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(LIBRARY_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(LIBRARY_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(LIBRARY_MODULE),
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: fullAccess(LIBRARY_MODULE),
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

// ============================================================
// Transportation (Module 13)
// ============================================================
const TRANSPORTATION_MODULE = 'transportation';
const TRANSPORTATION_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(TRANSPORTATION_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(TRANSPORTATION_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(TRANSPORTATION_MODULE),
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: fullAccess(TRANSPORTATION_MODULE),
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

// ============================================================
// Health & Wellness (Module 16)
// ============================================================
const HEALTH_WELLNESS_MODULE = 'health-wellness';
const HEALTH_WELLNESS_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(HEALTH_WELLNESS_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(HEALTH_WELLNESS_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(HEALTH_WELLNESS_MODULE),
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [{ module: HEALTH_WELLNESS_MODULE, action: 'view' }],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

// ============================================================
// Inventory & Assets (Module 15)
// ============================================================
const INVENTORY_ASSETS_MODULE = 'inventory-assets';
const INVENTORY_ASSETS_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(INVENTORY_ASSETS_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(INVENTORY_ASSETS_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(INVENTORY_ASSETS_MODULE),
  // Hostel Admin deliberately NOT granted view here, even though Hostel's
  // per-room inventory reuses this module's Item/StockTransaction data —
  // matches the "no cross-module grant" default. Revisit if Hostel Admin
  // needs to browse Inventory directly rather than through Hostel's own
  // screens (which can call Inventory's endpoints server-side without the
  // Hostel Admin needing their own inventory-assets:view grant, the same
  // way Fee Management's receipt generation doesn't require the caller to
  // hold a Documents permission).
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

// ============================================================
// Cafeteria & Meal Management (Module 22)
// ============================================================
const CAFETERIA_MODULE = 'cafeteria';
const CAFETERIA_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(CAFETERIA_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(CAFETERIA_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(CAFETERIA_MODULE),
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: fullAccess(CAFETERIA_MODULE),
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

// ============================================================
// Hostel Management (Module 14)
// ============================================================
// The first Phase 3 module with its own dedicated system role. Hostel Admin
// gets full CRUD on 'hostel' only — no grant to Student Lifecycle, Inventory,
// or any other module (see session discussion). School Admin + District
// Admin also get full access, matching every other Phase 3 module's
// admin-oversight precedent.
const HOSTEL_MODULE = 'hostel';
const HOSTEL_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(HOSTEL_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(HOSTEL_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(HOSTEL_MODULE),
  [SystemRoleName.HOSTEL_ADMIN]: fullAccess(HOSTEL_MODULE),
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
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

export const PHASE_3_ROLE_PERMISSIONS = mergeByRole(
  LIBRARY_PERMISSIONS,
  TRANSPORTATION_PERMISSIONS,
  HEALTH_WELLNESS_PERMISSIONS,
  INVENTORY_ASSETS_PERMISSIONS,
  CAFETERIA_PERMISSIONS,
  HOSTEL_PERMISSIONS,
);