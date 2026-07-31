'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { ReservationsView } from '@/components/library/ReservationsView';

export default function LibraryReservationsPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar title="Library" description="Track pending and fulfilled book reservations." />
      <div className="p-6">
        <LibraryTabs />
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : (
          <ReservationsView tenantId={user.tenantId!} />
        )}
      </div>
    </>
  );
}
