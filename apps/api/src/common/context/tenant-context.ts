import { AsyncLocalStorage } from 'async_hooks';
import { EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

export interface TenantContextStore {
  tenantId: string | null;
  /**
   * True once tenant identity has been *definitively* determined for this
   * request — including the platform-level case (a Super Admin JWT, whose
   * tenantId is legitimately null). False/undefined means "not resolved
   * yet" (pre-auth public routes, login itself) — TenantRlsInterceptor
   * treats these two differently: a resolved null still opens an
   * RLS-scoped transaction (with the session var set to '' ), while an
   * unresolved null skips RLS wrapping entirely, same as before this flag
   * existed. Without this distinction, "no tenant because not logged in
   * yet" and "no tenant because this IS the platform-level Super Admin"
   * were indistinguishable, since both left tenantId as plain `null`.
   */
  tenantResolved?: boolean;
  userId?: string;
  roleId?: string;
  /**
   * Set by TenantRlsInterceptor for the duration of a request once a tenantId
   * is resolved. When present, repositories MUST read through this manager
   * (via scopedRepo below) rather than the module-level injected repository,
   * or RLS enforcement is silently bypassed.
   */
  manager?: EntityManager;
}

/**
 * Tenant resolution happens once at the gateway (middleware below) and is propagated
 * through every downstream call via AsyncLocalStorage — never re-derived per module.
 * (Blueprint 4.3: "Tenant resolution happens once ... never re-derived per module.")
 */
export const tenantStorage = new AsyncLocalStorage<TenantContextStore>();

export function getCurrentTenantId(): string | null {
  return tenantStorage.getStore()?.tenantId ?? null;
}

export function getCurrentUserId(): string | undefined {
  return tenantStorage.getStore()?.userId;
}

/**
 * Returns a repository bound to the request's RLS-scoped transaction if one
 * is active (see TenantRlsInterceptor), otherwise falls back to the given
 * default repository (used by public/pre-auth routes with no tenant context,
 * e.g. tenant provisioning and login).
 */
export function scopedRepo<T extends ObjectLiteral>(
  fallback: Repository<T>,
  entity: EntityTarget<T>,
): Repository<T> {
  const manager = tenantStorage.getStore()?.manager;
  return manager ? manager.getRepository(entity) : fallback;
}
