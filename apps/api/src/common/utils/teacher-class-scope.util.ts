import { ForbiddenException } from '@nestjs/common';
import { TimetableService } from '../../modules/timetable/timetable.service';

/**
 * Checks whether a Teacher is assigned (per the timetable) to teach a given
 * class. Originally built for Examinations' write-side checks; promoted to
 * common/ now that Attendance needs the identical logic, rather than
 * duplicating it a third time.
 *
 * "Unscoped" fallback (classIds.length === 0) applies to ANY caller with no
 * timetable assignments — this includes School/District Admin, who
 * naturally have zero TimetableSlot rows — so this is safe to call
 * unconditionally regardless of the caller's actual role.
 */
export async function assertTeacherClassAccess(
  timetableService: TimetableService,
  tenantId: string,
  teacherId: string,
  schoolClassId: string,
): Promise<void> {
  const classIds = await timetableService.findClassIdsForTeacher(tenantId, teacherId);
  if (classIds.length === 0) return; // unscoped — Admin, or a Teacher not yet assigned a timetable
  if (!classIds.includes(schoolClassId)) {
    throw new ForbiddenException('You are not assigned to teach this class.');
  }
}

/**
 * Subject-aware sibling of assertTeacherClassAccess. Added when
 * Assignment Submissions scoping surfaced a gap the class-only check
 * can't cover: a teacher can be timetabled for one subject in a class
 * (e.g. Math) while a different teacher covers another subject in that
 * SAME class (e.g. Science) — class-only scoping would wrongly let the
 * Math teacher grade/view/download Science submissions in a class they
 * share. Use this wherever the resource being accessed (an assignment, a
 * submission, etc.) has its own subject_id to check against; keep using
 * the plain class-only assertTeacherClassAccess for resources with no
 * subject dimension (e.g. Attendance, which is per-class not per-subject).
 *
 * Same unscoped fallback as assertTeacherClassAccess: a caller with zero
 * timetable assignments at all (Admin, or an unassigned Teacher) is never
 * blocked by this check.
 */
export async function assertTeacherClassSubjectAccess(
  timetableService: TimetableService,
  tenantId: string,
  teacherId: string,
  schoolClassId: string,
  subjectId: string,
): Promise<void> {
  const classIds = await timetableService.findClassIdsForTeacher(tenantId, teacherId);
  if (classIds.length === 0) return; // unscoped — Admin, or a Teacher not yet assigned a timetable

  const hasMatch = await timetableService.hasTeacherClassSubjectAssignment(
    tenantId,
    teacherId,
    schoolClassId,
    subjectId,
  );
  if (!hasMatch) {
    throw new ForbiddenException('You are not assigned to teach this subject for this class.');
  }
}