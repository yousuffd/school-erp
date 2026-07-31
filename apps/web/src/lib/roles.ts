import { AuthUser } from './types';

/**
 * Client-side authorization checks — for UX only (hiding actions/nav a role
 * can't use), never the actual security boundary. The backend's RbacGuard
 * (and, for self-service routes, the ownership check inside each service) is
 * what really enforces this; these just keep the UI from offering sections
 * that would only ever 403 for that role/permission set.
 *
 * hasPermission() is the general-purpose check — reads the real
 * module+action permission set returned at login/refresh (see
 * AuthService.issueTokens on the backend), the same data-driven mechanism
 * RbacGuard itself checks server-side. This is what nav visibility should
 * use for anything module-gated, since it correctly handles CUSTOM roles an
 * Admin creates via the Role & Permission matrix editor — a hardcoded
 * role-name list can never know about a role that didn't exist when the
 * list was written.
 *
 * The role-name helpers below (isCoreAdminRole/isStudentRole/isSuperAdminRole)
 * are DELIBERATELY KEPT, not replaced by hasPermission() — they check
 * genuine role-CATEGORY distinctions that aren't really about module
 * permissions at all: isStudentRole detects self-service-only accounts,
 * isSuperAdminRole gates a platform-level boundary (tenant provisioning)
 * that no amount of custom permissions should ever grant. Use hasPermission()
 * for "can this role use module X"; use these for "is this fundamentally a
 * Student account" / "is this literally the platform Super Admin."
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  module: string,
  action: string,
): boolean {
  // Fail-closed: a user object with no permissions array (e.g. an existing
  // browser session's cached user object from before this field existed,
  // until their next login/refresh) is treated as having NO permissions,
  // not full access. This is a temporary, expected rollout side-effect —
  // not a bug — resolved automatically the next time that session refreshes.
  if (!user?.permissions) return false;
  return user.permissions.some((p) => p.module === module && p.action === action);
}

export const CORE_ADMIN_ROLES = ['Super Admin', 'District/Trust Admin', 'School Admin'];

export function isCoreAdminRole(role?: string | null): boolean {
  return !!role && CORE_ADMIN_ROLES.includes(role);
}

export function isStudentRole(role?: string | null): boolean {
  return role === 'Student';
}

/**
 * Narrower than isCoreAdminRole() — tenant provisioning is platform-level,
 * not something School/District Admin should be able to do (they manage
 * their own already-provisioned tenant, not create new ones). Only
 * Super Admin. Deliberately NOT converted to a hasPermission() check even
 * though a 'tenant-provisioning' permission key exists in the backend
 * matrix — see TenantProvisioningGuard's doc comment on the backend for why
 * this specific capability stays a hard role check rather than something a
 * custom role could ever be granted.
 */
export function isSuperAdminRole(role?: string | null): boolean {
  return role === 'Super Admin';
}
