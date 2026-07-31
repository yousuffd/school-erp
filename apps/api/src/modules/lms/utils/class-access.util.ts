import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { StudentsService } from '../../students/students.service';

/**
 * Shared access check for LMS self-service reads/writes (Resources,
 * Lectures, Discussions): allow a staff member with the given 'lms'
 * permission, OR a Student whose own class matches the resource's class.
 * Generalizes the dual staff-OR-owner pattern first used in
 * AssignmentSubmissionsService.getFileForDownload, since these three
 * modules all need the identical check rather than three near-duplicate
 * implementations.
 */
export async function assertClassAccess(
  user: AuthenticatedUser,
  schoolClassId: string,
  studentsService: StudentsService,
  requiredAction: 'view' | 'create' = 'view',
): Promise<void> {
  const hasStaffAccess = (user.permissions ?? []).some((p) => p.module === 'lms' && p.action === requiredAction);
  if (hasStaffAccess) return;

  if (user.studentId) {
    const student = await studentsService.findOne(user.studentId);
    if (student.school_class_id === schoolClassId) return;
  }

  throw new ForbiddenException('You do not have access to this class.');
}
