'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { HostelView } from '@/components/hostel/HostelView';

export default function HostelPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Hostel"
        description="Room allocation, visitors, maintenance, attendance, and roommate matching."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <HostelView tenantId={user.tenantId!} />}
      </div>
    </>
  );
}