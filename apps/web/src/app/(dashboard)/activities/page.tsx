'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { ActivitiesView } from '@/components/activities/ActivitiesView';

export default function ActivitiesPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Activities & Events"
        description="Clubs, teams, competitions, sports fixtures, and awards."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <ActivitiesView />}
      </div>
    </>
  );
}