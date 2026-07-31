import { RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../entities/role.entity';

/**
 * Phase 5 permissions. First module: Activities, Events & Sports
 * (Module 21). Discipline & Behaviour and Document Management will each
 * get their own block added here as they're built, following the exact
 * consolidation pattern phase3/phase4-permission-matrix.ts established.
 * NOTE: unlike phase4-permission-matrix.ts's PHASE_4_ROLE_PERMISSIONS
 * export (which silently dropped PAYROLL_PERMISSIONS from its
 * mergeByRole() call — see Deliverables, session 30 bug fix), double-check
 * every new block added here is actually passed into the final
 * mergeByRole(...) call below before considering a new module "wired".
 */
const ALL_ACTIONS: RequiredPermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];

const fullAccess = (module: string): RequiredPermission[] =>
  ALL_ACTIONS.map((action) => ({ module, action }));

// ============================================================
// Activities, Events & Sports (Module 21)
// ============================================================
// Activity Coordinator is a new dedicated system role, matching the
// Hostel/HR/Payroll/Library/Transportation/Cafeteria Admin precedent.
// Teacher gets view-only (coaches/club advisors need to see rosters/
// events without full CRUD — same view-only precedent as Health &
// Wellness). Student/Parent get NO module-level grant here — their
// access is entirely through the my-roster/my-registrations/my-awards
// self-service routes (resolveSelfServiceStudentId), same pattern as
// Examinations' my-results, not through a permissions grant.
const ACTIVITIES_MODULE = 'activities';
const ACTIVITIES_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: fullAccess(ACTIVITIES_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(ACTIVITIES_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(ACTIVITIES_MODULE),
  [SystemRoleName.ACTIVITY_COORDINATOR]: fullAccess(ACTIVITIES_MODULE),
  [SystemRoleName.TEACHER]: [{ module: ACTIVITIES_MODULE, action: 'view' }],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
};

// ============================================================
// Discipline & Behaviour Management (Module 20)
// ============================================================
// Counselor is a new dedicated system role, matching the established
// module-specific admin-role precedent. Teacher gets view + create
// (reports incidents, per blueprint's "Class Teacher" role) but not
// edit/delete/approve. Parent gets NO module-level grant — access is
// entirely through incidents/my-child-incidents and
// incidents/my-child-points-balance (resolveParentOnlyStudentId), not a
// permissions grant. Student gets NOTHING at all here — deliberately
// excluded per explicit decision, unlike Activities/Examinations where
// Student has self-service; do not add a Student grant to this matrix
// without a fresh explicit decision to reverse that.
const DISCIPLINE_MODULE = 'discipline';
const DISCIPLINE_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: fullAccess(DISCIPLINE_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(DISCIPLINE_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(DISCIPLINE_MODULE),
  [SystemRoleName.COUNSELOR]: fullAccess(DISCIPLINE_MODULE),
  [SystemRoleName.TEACHER]: [
    { module: DISCIPLINE_MODULE, action: 'view' },
    { module: DISCIPLINE_MODULE, action: 'create' },
  ],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};


// ============================================================
// Document Management & Digital Signatures (Module 19)
// ============================================================
// No new dedicated role — reuses existing roles per explicit decision.
// HR Manager keeps full access (continuity from managing what used to be
// HrPolicyDocument before this module absorbed it — see
// MigrateHrPolicyDocumentsData migration). Teacher gets view + create
// (can upload student documents / issue certificates, matching
// blueprint's "Staff" involved role) but not edit/delete/approve.
// Student/Parent get NO module-level grant — their only access is direct
// ownership-checked routes (documents/:id/file, certificates/:id/pdf),
// not a browsable self-service list (no "my documents" listing route
// exists yet — a real gap, logged as an Open Question).
const DOCUMENTS_MODULE = 'documents';
const DOCUMENTS_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(DOCUMENTS_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(DOCUMENTS_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(DOCUMENTS_MODULE),
  [SystemRoleName.HR_MANAGER]: fullAccess(DOCUMENTS_MODULE),
  [SystemRoleName.TEACHER]: [
    { module: DOCUMENTS_MODULE, action: 'view' },
    { module: DOCUMENTS_MODULE, action: 'create' },
  ],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
  [SystemRoleName.COUNSELOR]: [],
};


// ============================================================
// Alumni & Advancement (Module 23)
// ============================================================
// Admin-only per explicit decision — no new dedicated role (Alumni
// Relations Officer / Development-Fundraising Team from the blueprint
// were both explicitly not created), no Teacher grant (unlike every
// other Phase 5 module), and no alumnus self-service at all (admin/
// officer-managed only, confirmed explicitly before building).
const ALUMNI_MODULE = 'alumni';
const ALUMNI_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(ALUMNI_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(ALUMNI_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(ALUMNI_MODULE),
  [SystemRoleName.TEACHER]: [],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
  [SystemRoleName.COUNSELOR]: [],
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

export const PHASE_5_ROLE_PERMISSIONS = mergeByRole(ACTIVITIES_PERMISSIONS, DISCIPLINE_PERMISSIONS, DOCUMENTS_PERMISSIONS, ALUMNI_PERMISSIONS);
