import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';

/**
 * Enforces the Phase 0 RBAC matrix (kickoff §4):
 *   Super Admin        -> full access everywhere
 *   District/Trust Admin -> full, scoped to own tenant
 *   School Admin        -> full, scoped to own campus
 *   Teacher              -> no access to Core Admin / User Mgmt / Tenant Provisioning
 *
 * Reads the caller's permission set (attached to req.user by JwtStrategy from the
 * role's stored `permissions` at token-issue time) and checks it against the
 * @Permissions() metadata declared on the route.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true; // route didn't opt into RBAC checks

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;


    const grantedPermissions: RequiredPermission[] = user.permissions ?? [];
    const hasAll = required.every((req) =>
      grantedPermissions.some((g) => g.module === req.module && g.action === req.action),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Role '${user.roleName}' lacks required permission(s) for this action.`,
      );
    }
    return true;
  }
}
