'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { AlumniView } from '@/components/alumni/AlumniView';

export default function AlumniPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Alumni & Advancement"
        description="Alumni directory, reunions, donations, and mentorship matching."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <AlumniView />}
      </div>
    </>
  );
}