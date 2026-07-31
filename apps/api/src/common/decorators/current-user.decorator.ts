import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequiredPermission } from './permissions.decorator';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  roleId: string;
  roleName: string;
  email: string;
  /** Present only when this account is linked to a Student record. */
  studentId?: string;
  /**
   * Present only when this account is linked (via ParentStudentLink) to
   * one or more Student records. See JwtPayload's doc comment for the
   * "computed once at login, stale until re-login" caveat this inherits.
   */
  parentOfStudentIds?: string[];
  /** Present on every authenticated request — JwtStrategy attaches the role's current permission set. */
  permissions?: RequiredPermission[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);