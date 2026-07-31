'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { DisciplineView } from '@/components/discipline/DisciplineView';
import { ParentDisciplineView } from '@/components/discipline/ParentDisciplineView';

export default function DisciplinePage() {
  const user = auth.getUser();
  const isParent = user?.role === 'Parent';

  const description = isParent
    ? "View your child's behaviour incidents and points balance."
    : 'Incident reporting, merit/demerit points, corrective actions, and counseling referrals.';

  return (
    <>
      <TopBar title="Behaviour & Discipline" description={description} />
      <div className="p-6">
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : isParent ? (
          <ParentDisciplineView />
        ) : (
          <DisciplineView />
        )}
      </div>
    </>
  );
}