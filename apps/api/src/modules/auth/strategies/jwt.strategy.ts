import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RolesService } from '../../roles/roles.service';

export interface JwtPayload {
  sub: string; // user id
  /**
   * Null for the platform-level Super Admin account (see
   * SUPER_ADMIN_DASHBOARD_SCOPE.md §4a) — every other user always has a
   * real tenant UUID here.
   */
  tenantId: string | null;
  roleId: string;
  roleName: string;
  email: string;
  /**
   * Present only when this user IS a student (see User.student_id). Carried
   * in the token itself — rather than looked up per-request — so the
   * ownership guard for self-service endpoints (e.g. Assignments
   * submission) doesn't need an extra DB round-trip on every request just
   * to answer "which student is this."
   */
  studentId?: string;
  /**
   * Present only when this account is linked (via ParentStudentLink) to
   * one or more Student records. Computed ONCE at login time from
   * ParentStudentLinksService, then carried forward unchanged on refresh()
   * — identical treatment to studentId above, and the identical tradeoff:
   * if a link is added or removed after this token was issued, the caller
   * won't see the change until they fully re-login (refresh() deliberately
   * does not re-query this). Kept undefined (not an empty array) when the
   * account has no linked students, matching studentId's `?? undefined`
   * convention, to keep tokens for non-Parent accounts unchanged in size.
   */
  parentOfStudentIds?: string[];
}

/**
 * Validates the access token and hydrates the request.user object with the
 * caller's *current* permission set (re-read from the DB, not trusted from the
 * token) so a mid-session permission change takes effect on the next request
 * without waiting for token expiry.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly rolesService: RolesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Passes payload.tenantId through so RolesService.findOne() can apply
    // an explicit tenant filter — this call runs during the Guards phase,
    // before TenantRlsInterceptor has opened an RLS-scoped transaction, so
    // this is the only tenant scoping active at this point in the request
    // (see RolesService.findOne's docstring for the full explanation).
    // payload.tenantId may be null (Super Admin) — findOne treats null and
    // a real UUID both as "resolved" and only treats undefined as
    // "no context", so this passes through unchanged either way.
    const role = await this.rolesService.findOne(payload.roleId, payload.tenantId).catch(() => null);
    if (!role) throw new UnauthorizedException('Role no longer exists');

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      email: payload.email,
      studentId: payload.studentId,
      parentOfStudentIds: payload.parentOfStudentIds,
      permissions: role.permissions,
    };
  }
}
