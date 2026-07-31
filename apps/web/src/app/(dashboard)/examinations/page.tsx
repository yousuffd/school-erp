'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { TeacherExaminationsView } from '@/components/examinations/TeacherExaminationsView';
import { StudentExaminationsView } from '@/components/examinations/StudentExaminationsView';
import { ParentExaminationsView } from '@/components/examinations/ParentExaminationsView';

export default function ExaminationsPage() {
  const user = auth.getUser();
  const isStudent = !!user?.studentId;
  const isParent = user?.role === 'Parent';

  const description = isStudent
    ? 'View your exam results and download your report card.'
    : isParent
      ? "View your child's exam results and download their report card."
      : 'Create exams, enter marks, and generate report cards.';

  return (
    <>
      <TopBar title="Examinations" description={description} />
      <div className="p-6">
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : isStudent ? (
          <StudentExaminationsView />
        ) : isParent ? (
          <ParentExaminationsView />
        ) : (
          <TeacherExaminationsView tenantId={user.tenantId!} />
        )}
      </div>
    </>
  );
}