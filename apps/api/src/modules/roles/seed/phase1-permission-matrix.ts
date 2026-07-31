import { RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../entities/role.entity';

/**
 * Phase 1 permissions across both modules built so far: Student Lifecycle
 * Management and Admissions & Enrollment.
 *
 * IMPORTANT — Parent and Student intentionally get ZERO access to either
 * module, not an oversight. The current RBAC model is role+module based
 * only: it has no concept of "this parent may only see their own child's
 * record/application." Granting Parent/Student `view` the same way other
 * roles get it would let any parent list every student or application in
 * the school — a real privacy problem, not a nitpick. Do not grant these
 * roles access until row-level/ownership scoping exists (tracked as a
 * backlog item — needed before the Parent/Student portals can safely ship).
 *
 * Also note: the blueprint's own role catalog for Admissions names
 * "Admissions Officer" and "Front Office" as the intended day-to-day users,
 * not School Admin. Those are deliberately NOT added as new system roles yet
 * — that's a real role-system expansion (new roles must be seeded across
 * every existing tenant, not just a permission update) better done once the
 * workflow actually needs that distinction from full Admin. For now,
 * Admin-tier roles manage admissions directly. Same reasoning applies to
 * Academic Management's "Academic Coordinator"/"HOD" roles.
 */
const STUDENT_LIFECYCLE_MODULE = 'student-lifecycle';
const ADMISSIONS_MODULE = 'admissions';
const ACADEMIC_MANAGEMENT_MODULE = 'academic-management';
const ATTENDANCE_MODULE = 'attendance';
const FEE_MANAGEMENT_MODULE = 'fee-management';
const COMMUNICATION_MODULE = 'communication';
const ALL_ACTIONS: RequiredPermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];

const fullAccess = (module: string): RequiredPermission[] =>
  ALL_ACTIONS.map((action) => ({ module, action }));

export const PHASE_1_ROLE_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [],
  //   ...fullAccess(STUDENT_LIFECYCLE_MODULE),
  //   ...fullAccess(ADMISSIONS_MODULE),
  //   ...fullAccess(ACADEMIC_MANAGEMENT_MODULE),
  //   ...fullAccess(ATTENDANCE_MODULE),
  //   ...fullAccess(FEE_MANAGEMENT_MODULE),
  //   ...fullAccess(COMMUNICATION_MODULE),
  // ],
  [SystemRoleName.DISTRICT_ADMIN]: [
    ...fullAccess(STUDENT_LIFECYCLE_MODULE), // "Full (own tenants)"
    ...fullAccess(ADMISSIONS_MODULE),
    ...fullAccess(ACADEMIC_MANAGEMENT_MODULE),
    ...fullAccess(ATTENDANCE_MODULE),
    ...fullAccess(FEE_MANAGEMENT_MODULE),
    ...fullAccess(COMMUNICATION_MODULE),
  ],
  [SystemRoleName.SCHOOL_ADMIN]: [
    ...fullAccess(STUDENT_LIFECYCLE_MODULE), // "Full (own campus)"
    ...fullAccess(ADMISSIONS_MODULE),
    ...fullAccess(ACADEMIC_MANAGEMENT_MODULE),
    ...fullAccess(ATTENDANCE_MODULE),
    ...fullAccess(FEE_MANAGEMENT_MODULE),
    ...fullAccess(COMMUNICATION_MODULE),
  ],
  [SystemRoleName.TEACHER]: [
    { module: STUDENT_LIFECYCLE_MODULE, action: 'view' },
    { module: ACADEMIC_MANAGEMENT_MODULE, action: 'view' }, // view their timetable — still unscoped, see note below
    // Marking attendance is literally the Class Teacher's job per the
    // blueprint's own role list for this module — unlike the view-only
    // pattern elsewhere, Teacher gets real write access here.
    { module: ATTENDANCE_MODULE, action: 'view' },
    { module: ATTENDANCE_MODULE, action: 'create' },
    { module: ATTENDANCE_MODULE, action: 'edit' },
    // View-only on circulars for now — composing/publishing them is kept to
    // Admin-tier by default. A reasonable school might want Teachers to send
    // their own class-level announcements; worth revisiting if that comes up.
    { module: COMMUNICATION_MODULE, action: 'view' },
    // No fee-management access — blueprint's role list for this module is
    // "Accountant, Admin, Parent," not Teacher.
  ],
  [SystemRoleName.PARENT]: [], // deliberately empty — see file header
  [SystemRoleName.STUDENT]: [], // deliberately empty — see file header
  [SystemRoleName.HOSTEL_ADMIN]: [{ module: STUDENT_LIFECYCLE_MODULE, action: 'view' }],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};

/**
 * Note on Teacher's `view` permissions: both are currently unscoped — a
 * Teacher can view any student or any part of the timetable in the tenant,
 * not just their own assigned classes. Academic Management's class_teacher_id
 * and timetable teacher_id fields are exactly what would let this finally be
 * scoped properly (filter by "classes where teacher_id = the requester"),
 * but that scoping logic itself is a deliberate follow-up, not bundled into
 * this pass — this module lays the foundation for it, it doesn't implement it.
 */
