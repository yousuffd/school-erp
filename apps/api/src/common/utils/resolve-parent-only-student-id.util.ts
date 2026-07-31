import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Like resolveSelfServiceStudentId (Activities/Examinations), but
 * deliberately PARENT-ONLY — a Student caller is rejected outright, not
 * given automatic access to their own record. Used for Discipline &
 * Behaviour specifically, where Student was a deliberate scope exclusion
 * (blueprint doesn't name Student as an involved role for this module,
 * and the user confirmed Student should stay out entirely) — do NOT
 * reuse resolveSelfServiceStudentId here, since that util's Student
 * branch would silently reopen the access this module intentionally
 * withholds.
 */
export function resolveParentOnlyStudentId(
  user: AuthenticatedUser,
  requestedStudentId: string | undefined,
): string {
  if (!user.parentOfStudentIds || user.parentOfStudentIds.length === 0) {
    throw new ForbiddenException('This endpoint is only available to Parent accounts.');
  }
  if (!requestedStudentId) {
    throw new BadRequestException(
      'studentId query parameter is required for Parent accounts — specify which child.',
    );
  }
  if (!user.parentOfStudentIds.includes(requestedStudentId)) {
    throw new ForbiddenException('This student is not linked to your account.');
  }
  return requestedStudentId;
}
