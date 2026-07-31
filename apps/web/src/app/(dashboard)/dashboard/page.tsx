'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { isCoreAdminRole, isStudentRole, isSuperAdminRole } from '@/lib/roles';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { ParentDashboard } from '@/components/dashboard/ParentDashboard';
import { DefaultDashboard } from '@/components/dashboard/DefaultDashboard';
import { PlatformDashboard } from '@/components/dashboard/PlatformDashboard';

const DESCRIPTIONS: Record<string, string> = {
  platform: 'SaaS platform overview — tenants, modules, and billing.',
  admin: 'Platform overview across your whole school.',
  teacher: 'Your classes, subjects, and exams at a glance.',
  student: 'Your assignments and exam results.',
  parent: "Your child's exam results.",
  default: 'Welcome to SchoolERP.',
};

/**
 * Thin dispatcher — replaces the previous single Core-Admin-only dashboard
 * (which every role hit, producing a permission-error banner for anyone
 * without core-admin access; see Open Question #7). Each role gets its own
 * dedicated component, same "separate components per role" convention this
 * codebase already uses elsewhere (e.g. TeacherExaminationsView vs. a
 * generic view), rather than one component with branching logic scattered
 * through it.
 *
 * Role detection deliberately uses the same role-CATEGORY helpers as
 * Sidebar.tsx (isCoreAdminRole/isStudentRole), not a hasPermission() check
 * — which dashboard someone sees is a role-identity question ("are you
 * fundamentally a Teacher/Student/Parent"), not a module-permission one.
 * A custom role, or a system role without dedicated content yet (Hostel
 * Admin, HR Manager, Payroll Admin), falls through to DefaultDashboard —
 * no guessing at what an unrecognized role wants to see.
 */
export default function DashboardPage() {
  const user = auth.getUser();

  let descriptionKey = 'default';
  let content = <DefaultDashboard />;

  if (isSuperAdminRole(user?.role)) {
    descriptionKey = 'platform';
    content = <PlatformDashboard />;
  } else if (isCoreAdminRole(user?.role)) {
    descriptionKey = 'admin';
    content = <AdminDashboard tenantId={user!.tenantId!} />;
  } else if (user?.role === 'Teacher') {
    descriptionKey = 'teacher';
    content = <TeacherDashboard tenantId={user!.tenantId!} />;
  } else if (isStudentRole(user?.role)) {
    descriptionKey = 'student';
    content = <StudentDashboard />;
  } else if (user?.role === 'Parent') {
    descriptionKey = 'parent';
    content = <ParentDashboard />;
  }

  return (
    <>
      <TopBar title="Dashboard" description={DESCRIPTIONS[descriptionKey]} />
      {content}
    </>
  );
}
