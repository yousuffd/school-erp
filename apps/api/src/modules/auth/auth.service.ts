import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { TenantsService } from '../tenants/tenants.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserStatus } from '../users/entities/user.entity';
import { ParentStudentLinksService } from '../students/parent-student-links.service';
import { RequiredPermission } from '../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../roles/entities/role.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly parentStudentLinksService: ParentStudentLinksService,
  ) {}

  /**
   * Local-credentials login (Phase 0). SSO (Google/Microsoft/SAML) plugs in as a
   * sibling Passport strategy + a `/auth/sso/:provider/callback` route later —
   * this method and the token-issuing logic below are provider-agnostic already,
   * since they only need a resolved user id / tenant id / role, whichever auth
   * path produced them.
   *
   * `dto.subdomain` is optional (see SUPER_ADMIN_DASHBOARD_SCOPE.md §4a) — its
   * absence routes to loginPlatformSuperAdmin() below, the platform-level
   * (no-tenant) login path. Every normal tenant user must still send it.
   */
  async login(dto: LoginDto) {
    if (!dto.subdomain) {
      return this.loginPlatformSuperAdmin(dto);
    }

    // Resolves subdomain -> real tenant id first. A non-existent subdomain
    // folds into the same generic 'Invalid credentials' response as a
    // wrong password/email below — never a distinguishable error, so a
    // caller can't enumerate which subdomains exist on the platform.
    const tenant = await this.tenantsService.findBySubdomain(dto.subdomain);
    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersService.findByEmailWithPassword(tenant.id, dto.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.INVITED) {
      throw new UnauthorizedException('User account is disabled');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const role = await this.rolesService.findOne(user.role_id, user.tenant_id);

    // Queried unconditionally (cheap — empty array for the overwhelming
    // majority of non-Parent logins), same "don't hardcode a role-name
    // check, let the data decide" philosophy used for Teacher scoping.
    // Kept undefined rather than an empty array on the token, mirroring
    // studentId's ?? undefined convention below.
    const parentOfStudentIds = await this.parentStudentLinksService.findStudentIdsForParent(
      user.tenant_id,
      user.id,
    );

    return this.issueTokens(
      {
        sub: user.id,
        tenantId: user.tenant_id,
        roleId: user.role_id,
        roleName: role.name,
        email: user.email,
        studentId: user.student_id ?? undefined,
        parentOfStudentIds: parentOfStudentIds.length > 0 ? parentOfStudentIds : undefined,
      },
      role.permissions,
    );
  }

  /**
   * Platform-level Super Admin login — no subdomain, no tenant at all.
   * Deliberately does NOT reuse the tenant-login flow above: there's no
   * tenant to resolve, no ParentStudentLinksService lookup that makes
   * sense (a platform account is never a parent), and the user lookup
   * itself needs its own RLS-aware connection (see
   * UsersService.findPlatformUserByEmailWithPassword) since no tenant
   * context/RLS transaction exists yet at this point in the request.
   *
   * The role.name === SUPER_ADMIN check is a defense-in-depth guard, not
   * the primary access control — a tenant_id IS NULL user row should never
   * exist for any other role (RolesService.seedSystemRolesForTenant never
   * seeds a tenant with a null-tenant role other than Super Admin), but if
   * that data invariant were ever violated, this still refuses to issue a
   * platform-level token to anything but a genuine Super Admin, folding
   * the failure into the same generic 'Invalid credentials' response as
   * every other rejection path here.
   */
  private async loginPlatformSuperAdmin(dto: LoginDto) {
    const user = await this.usersService.findPlatformUserByEmailWithPassword(dto.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.INVITED) {
      throw new UnauthorizedException('User account is disabled');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // user.tenant_id is null here; RolesService.findOne treats null as a
    // resolved (not "no context") tenantId and correctly matches the
    // null-tenant Super Admin role.
    const role = await this.rolesService.findOne(user.role_id, user.tenant_id);
    if (role.name !== SystemRoleName.SUPER_ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(
      {
        sub: user.id,
        tenantId: user.tenant_id,
        roleId: user.role_id,
        roleName: role.name,
        email: user.email,
        studentId: undefined,
        parentOfStudentIds: undefined,
      },
      role.permissions,
    );
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify<JwtPayload & { exp?: number; iat?: number; nbf?: number }>(
        refreshToken,
        { secret: this.config.get<string>('JWT_REFRESH_SECRET') },
      );
      // The decoded token carries its own exp/iat (and possibly nbf) claims from
      // when it was originally issued. Reusing the raw decoded object as the
      // payload for freshly-signed tokens conflicts with the new `expiresIn` we
      // pass below — the JWT library rejects signing a payload that already has
      // an `exp` while also being told a new expiry, exactly the bug that
      // caused every refresh attempt to fail with a misleading 401. Only the
      // actual claims we care about get carried forward.
      const { exp, iat, nbf, ...payload } = decoded;
      // Re-issue with fresh role/permission lookup rather than trusting the old payload.
      // studentId AND parentOfStudentIds both flow through here automatically
      // as part of ...payload — they were already part of the original signed
      // token, so no extra DB lookup is needed on refresh for those two. The
      // PERMISSIONS returned to the frontend, however, DO get refreshed here —
      // role.permissions is looked up fresh below and passed into issueTokens,
      // same as login() — so a mid-session permission change (e.g. an Admin
      // editing a custom role's permissions) reaches the frontend's nav-
      // visibility logic within one refresh cycle (~15 min), not never. This
      // is the same design intent JwtStrategy's own per-request permission
      // lookup already has for backend enforcement — now the frontend's copy
      // stays similarly current, just on the refresh cadence instead of every
      // single request.
      //
      // payload.tenantId is passed through here for the same reason as the
      // login call above: this refresh flow verifies the JWT manually (never
      // goes through JwtStrategy/Guards), so no x-tenant-id header or
      // resolved tenant context exists for this request either — without
      // this, RolesService.findOne() would hit an unscoped connection and
      // return zero rows once RLS is genuinely enforced, same failure mode
      // as the original login bug. payload.tenantId may be null (Super
      // Admin) — findOne() treats null as resolved, same as everywhere else.
      const role = await this.rolesService.findOne(payload.roleId, payload.tenantId);
      return this.issueTokens({ ...payload, roleName: role.name }, role.permissions);
    } catch (err) {
      // Previously this was a bare `catch {}` that discarded the real error —
      // meaning "token genuinely expired", "signature invalid", and "role
      // lookup failed" were all indistinguishable from the server logs. Log
      // the real cause here; the client still only ever sees the generic
      // message below (no need to leak internals to the caller).
      this.logger.warn(
        `Refresh token rejected: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * `permissions` is deliberately a SEPARATE parameter, not part of
   * `payload` — it gets attached to the RETURNED user object below, but is
   * never included in the signed JWT itself (jwtService.sign(payload, ...)
   * only ever signs `payload`, unchanged). This preserves JwtStrategy's
   * original design: permissions are re-checked fresh from the DB on every
   * single backend request via RbacGuard, not trusted from a stale token
   * claim — baking permissions into the JWT would defeat that "a mid-session
   * permission change takes effect immediately" guarantee. The frontend's
   * copy of permissions (for nav-visibility only — never a real security
   * boundary, same as every other client-side check in lib/roles.ts) is
   * refreshed on the same ~15-minute cadence as everything else in the
   * refresh() flow above, which is different from (and looser than) the
   * backend's per-request re-check, but appropriate for a UX-only signal.
   */
  private issueTokens(payload: JwtPayload, permissions: RequiredPermission[] = []) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d'),
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      user: {
        id: payload.sub,
        tenantId: payload.tenantId,
        role: payload.roleName,
        email: payload.email,
        studentId: payload.studentId,
        parentOfStudentIds: payload.parentOfStudentIds,
        permissions,
      },
    };
  }
}
