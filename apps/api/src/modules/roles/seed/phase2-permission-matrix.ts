import { RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { SystemRoleName } from '../entities/role.entity';

/**
 * Phase 2 permissions: Examination & Assessment Management (first Phase 2
 * module — LMS and the AI Timetable Optimizer are deliberately separate,
 * larger efforts, not bundled in here).
 *
 * Teacher gets real create/edit access — same precedent as Attendance:
 * creating exams and entering marks is literally the Class/Subject
 * Teacher's job per the blueprint's own role list for this module ("Exam
 * Controller, Teacher, HOD, Student, Parent"). "Exam Controller" and "HOD"
 * are deliberately not added as new system roles — same reasoning as every
 * other blueprint-named role we've deferred (Admissions Officer, Front
 * Office, Accountant): real role-system expansion, not a quick add.
 *
 * Parent and Student get zero access — same ownership-scoping gap flagged
 * on every module so far. A parent seeing their own child's report card is
 * exactly the kind of thing this gap blocks.
 */
const EXAMINATIONS_MODULE = 'examinations';
const ALL_ACTIONS: RequiredPermission['action'][] = ['view', 'create', 'edit', 'delete', 'approve'];

const fullAccess = (module: string): RequiredPermission[] =>
  ALL_ACTIONS.map((action) => ({ module, action }));

export const PHASE_2_ROLE_PERMISSIONS: Record<SystemRoleName, RequiredPermission[]> = {
  [SystemRoleName.SUPER_ADMIN]: [], // fullAccess(EXAMINATIONS_MODULE),
  [SystemRoleName.DISTRICT_ADMIN]: fullAccess(EXAMINATIONS_MODULE),
  [SystemRoleName.SCHOOL_ADMIN]: fullAccess(EXAMINATIONS_MODULE),
  [SystemRoleName.TEACHER]: [
    { module: EXAMINATIONS_MODULE, action: 'view' },
    { module: EXAMINATIONS_MODULE, action: 'create' },
    { module: EXAMINATIONS_MODULE, action: 'edit' },
  ],
  [SystemRoleName.PARENT]: [],
  [SystemRoleName.STUDENT]: [],
  [SystemRoleName.HOSTEL_ADMIN]: [],
  [SystemRoleName.HR_MANAGER]: [],
  [SystemRoleName.PAYROLL_ADMIN]: [],
  [SystemRoleName.LIBRARY_ADMIN]: [],
  [SystemRoleName.TRANSPORTATION_ADMIN]: [],
  [SystemRoleName.CAFETERIA_ADMIN]: [],
  [SystemRoleName.COUNSELOR]: [],
  [SystemRoleName.ACTIVITY_COORDINATOR]: [],
};
