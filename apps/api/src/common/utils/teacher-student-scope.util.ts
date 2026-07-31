import { ForbiddenException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { TimetableService } from '../../modules/timetable/timetable.service';
import { Student } from '../../modules/students/entities/student.entity';
import { scopedRepo } from '../context/tenant-context';

/**
 * Resolves which student ids a Teacher is allowed to see — originally built
 * for Health & Wellness; promoted to common/ now that Attendance needs the
 * identical logic too.
 *
 * Same "no assignments = unscoped" fallback as teacher-class-scope.util —
 * safe to call unconditionally regardless of the caller's role.
 *
 * Returns null to mean "unscoped" (caller applies no filter at all),
 * distinct from an empty array (scoped, but sees nothing — a real,
 * different state).
 */
export async function getScopedStudentIds(
  timetableService: TimetableService,
  studentRepo: Repository<Student>,
  tenantId: string,
  teacherId: string,
): Promise<string[] | null> {
  const classIds = await timetableService.findClassIdsForTeacher(tenantId, teacherId);
  if (classIds.length === 0) return null;

  const students = await scopedRepo(studentRepo, Student).find({
    where: { tenant_id: tenantId, school_class_id: In(classIds) },
  });
  return students.map((s) => s.id);
}

/** Throws if a scoped Teacher is trying to reach a student outside their assigned classes. No-op if unscoped. */
export async function assertStudentInTeacherScope(
  timetableService: TimetableService,
  studentRepo: Repository<Student>,
  tenantId: string,
  teacherId: string,
  studentId: string,
): Promise<void> {
  const scopedIds = await getScopedStudentIds(timetableService, studentRepo, tenantId, teacherId);
  if (scopedIds === null) return;
  if (!scopedIds.includes(studentId)) {
    throw new ForbiddenException('You do not have access to this student\'s records.');
  }
}