import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { tenantStorage } from '../context/tenant-context';
import { TenantsService } from '../../modules/tenants/tenants.service';

/**
 * Resolves the tenant for the request from (in priority order):
 *   1. The `x-tenant-id` header (dev/testing convenience)
 *   2. Subdomain (e.g. greenwood.schoolerp.app -> "greenwood")
 *   3. A client-supplied `subdomain` in the request body (pre-auth login
 *      route only) — resolved to a real tenant id via TenantsService,
 *      since RLS's session variable must be a genuine UUID, not the raw
 *      subdomain string. Replaces the previous raw `tenant_id` body
 *      fallback once LoginDto switched from a raw tenant UUID field to a
 *      subdomain (easier for a real user to remember/type) — the login
 *      form no longer sends tenant_id at all, so resolving here is the
 *      only remaining way this route's RLS-protected user lookup gets a
 *      tenant context before authentication has happened.
 *
 *      NOTE: subdomain is now OPTIONAL on LoginDto (see
 *      SUPER_ADMIN_DASHBOARD_SCOPE.md §4a) — a request with no subdomain
 *      at all is the platform-level Super Admin login path, which
 *      AuthService/UsersService handle with their own dedicated
 *      connection (mirroring RolesService.findOne's pattern), entirely
 *      independent of this middleware/TenantRlsInterceptor. So this
 *      middleware deliberately does NOT need a special case for that
 *      login request — it simply leaves tenantId as null and
 *      tenantResolved unset here, same as any other pre-auth request,
 *      and AuthService's platform-login branch never relies on
 *      tenantStorage at all.
 *   4. A raw client-supplied `tenant_id` in the request body — kept for
 *      any other pre-auth caller that might still send the UUID directly.
 *   5. The `tenantId` claim inside a valid JWT, once auth has run (always wins if present)
 *
 * The resolved tenantId is stashed in AsyncLocalStorage so every service/repository
 * in this request's call chain can read it without threading it through every
 * function signature, and so the RLS session var can be set per-connection.
 *
 * NOTE: This middleware only *resolves* tenant identity. Setting the Postgres
 * `app.current_tenant_id` session variable happens in TenantRlsInterceptor,
 * which opens a scoped transaction per-request whenever tenant identity was
 * resolved here (see that file) — including the platform-level (null)
 * case, once tenantResolved is true.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantsService: TenantsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string | null = (req.headers['x-tenant-id'] as string) ?? null;

    if (!tenantId) {
      const host = req.hostname || '';
      const subdomain = host.split('.')[0];
      if (subdomain && !['localhost', 'api', 'www'].includes(subdomain)) {
        tenantId = subdomain;
      }
    }

    // Pre-auth login route sends a subdomain, not a raw tenant_id — resolve
    // it to a real tenant UUID here, since RLS's session variable can't be
    // the raw subdomain string. Without this, RLS-protected pre-auth
    // queries (e.g. the login lookup in UsersService.findByEmailWithPassword)
    // silently return zero rows — the query's own WHERE tenant_id = ...
    // clause is correct, but Postgres never sees a session tenant to match
    // against, so every row is invisible. Discovered live (again — this is
    // the same failure mode this middleware's fallback was originally
    // built to prevent, retriggered when LoginDto switched from tenant_id
    // to subdomain and this middleware wasn't updated to match).
    if (!tenantId && req.body?.subdomain) {
      const tenant = await this.tenantsService.findBySubdomain(req.body.subdomain);
      if (tenant) tenantId = tenant.id;
    }

    // Weakest fallback: a client-supplied raw tenant_id in the request
    // body, for any other pre-auth caller that might still send the UUID
    // directly rather than a subdomain.
    if (!tenantId && req.body?.tenant_id) {
      tenantId = req.body.tenant_id;
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.decode(authHeader.slice(7)) as {
          tenantId?: string | null;
          sub?: string;
          roleId?: string;
        } | null;
        // A decoded payload's tenantId is authoritative once present as a
        // key at all — including when its value is explicitly null (the
        // platform-level Super Admin case) — so this checks `!== undefined`
        // rather than truthiness, unlike the resolution steps above.
        if (payload && payload.tenantId !== undefined) tenantId = payload.tenantId;
        return tenantStorage.run(
          { tenantId, userId: payload?.sub, roleId: payload?.roleId, tenantResolved: true },
          () => next(),
        );
      } catch {
        // Invalid token is handled by JwtAuthGuard downstream; just don't attach claims.
      }
    }

    // Fallback: authenticated media routes (e.g. lecture video streaming)
    // that can't send a custom Authorization header — native <video>/<img>
    // tags have no way to attach one — pass a short-lived, single-purpose
    // media token via ?token= instead. Only consulted when no Authorization
    // header was present, so it never shadows the normal Bearer-token path.
    // This only resolves tenant context for RLS; real authorization of the
    // token happens downstream in the route itself (LecturesService).
    const queryToken = req.query?.token as string | undefined;
    if (!authHeader && queryToken) {
      try {
        const payload = this.jwtService.decode(queryToken) as {
          tenantId?: string | null;
          sub?: string;
        } | null;
        if (payload && payload.tenantId !== undefined) tenantId = payload.tenantId;
        return tenantStorage.run({ tenantId, userId: payload?.sub, tenantResolved: true }, () => next());
      } catch {
        // Invalid/expired token — let the route's own verification reject it properly.
      }
    }

    tenantStorage.run({ tenantId }, () => next());
  }
}
