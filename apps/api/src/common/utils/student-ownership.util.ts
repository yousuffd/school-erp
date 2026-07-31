import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Shared access check for student-level self-service reads (exam results,
 * report cards, and future modules with the same shape): allow a staff
 * member with the given module+action permission, OR a Student whose own
 * studentId matches the requested studentId exactly.
 *
 * This is deliberately NOT the same check as lms/utils/class-access.util.ts's
 * assertClassAccess. That helper checks CLASS membership (a Student can see
 * shared resources belonging to anyone in their school_class_id). This
 * checks direct STUDENT-ID ownership (a Student can only see their OWN
 * records, full stop) — a tighter, different shape, not a duplicate of the
 * LMS pattern despite the superficial "self-service ownership check"
 * similarity. Do not reuse assertClassAccess for this; do not merge these
 * two helpers into one without re-checking both call sites carefully.
 *
 * Sync (no DB lookup needed) — unlike assertClassAccess, which has to
 * resolve the student's class via StudentsService, this only needs a
 * direct id comparison against the JWT-derived studentId.
 */
export function assertOwnStudentAccess(
  user: AuthenticatedUser,
  studentId: string,
  module: string,
  requiredAction: 'view' | 'create' | 'edit' | 'delete' = 'view',
): void {
  const hasStaffAccess = (user.permissions ?? []).some(
    (p) => p.module === module && p.action === requiredAction,
  );
  if (hasStaffAccess) return;

  if (user.studentId && user.studentId === studentId) return;

  throw new ForbiddenException("You do not have access to this student's records.");
}
