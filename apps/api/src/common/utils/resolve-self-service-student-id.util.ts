import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Resolves which studentId a Student-or-Parent self-service caller is
 * actually allowed to query, following the exact precedent established in
 * ExamsController.findMyResults(): a Student's own studentId always wins
 * (any studentId query param they send is ignored, not trusted); a Parent
 * MUST supply a studentId, which must appear in their parentOfStudentIds.
 * Throws ForbiddenException/BadRequestException on any violation, exactly
 * matching that endpoint's messages, for a consistent experience across
 * every self-service endpoint that needs this same shape.
 */
export function resolveSelfServiceStudentId(
  user: AuthenticatedUser,
  requestedStudentId: string | undefined,
): string {
  if (user.studentId) {
    return user.studentId;
  }

  if (user.parentOfStudentIds && user.parentOfStudentIds.length > 0) {
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

  throw new ForbiddenException('This endpoint is only available to Student or Parent accounts.');
}
