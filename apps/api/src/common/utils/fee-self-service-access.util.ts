import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Fee & Payments self-service access check — Parent only. Teacher access
 * was built, tested, and then explicitly reversed by direct request
 * (Fee Management reverting to the blueprint's original "Accountant, Admin,
 * Parent" role list). Student remains excluded, per the original scope
 * decision. Kept as its own small utility (rather than inlined in each
 * service) since it's called from both FeeAssignmentsService and
 * FeePaymentsService.
 */
export function assertParentFeeAccess(user: AuthenticatedUser, studentId: string): void {
  if (user.roleName !== 'Parent') {
    throw new ForbiddenException('This endpoint is only available to Parent accounts.');
  }
  const linkedStudentIds = user.parentOfStudentIds ?? [];
  if (!linkedStudentIds.includes(studentId)) {
    throw new ForbiddenException('You can only view fee information for your own linked child.');
  }
}
