'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { TeacherAssignmentsView } from '@/components/assignments/TeacherAssignmentsView';
import { StudentAssignmentsView } from '@/components/assignments/StudentAssignmentsView';
import { LmsTabs } from '@/components/lms/LmsTabs';

export default function AssignmentsPage() {
  const user = auth.getUser();
  const isStudent = !!user?.studentId;

  return (
    <>
      <TopBar
        title="Assignments"
        description={
          isStudent
            ? 'View your assignments, submit your work, and see your grades.'
            : 'Create assignments and grade student submissions.'
        }
      />
      <div className="p-6">
        <LmsTabs />
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : isStudent ? (
          <StudentAssignmentsView />
        ) : (
          <TeacherAssignmentsView tenantId={user.tenantId!} />
        )}
      </div>
    </>
  );
}
