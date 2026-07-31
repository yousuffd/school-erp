'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { TransportationView } from '@/components/transportation/TransportationView';
import { ParentTransportOptOutView } from '@/components/transportation/ParentTransportOptOutView';

export default function TransportationPage() {
  const user = auth.getUser();
  const isParent = user?.role === 'Parent';

  const description = isParent
    ? 'Manage your transport opt-out preference.'
    : 'Manage vehicles, drivers, routes, and student assignments.';

  return (
    <>
      <TopBar title="Transportation" description={description} />
      <div className="p-6">
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : isParent ? (
          <ParentTransportOptOutView tenantId={user.tenantId!} />
        ) : (
          <TransportationView tenantId={user.tenantId!} />
        )}
      </div>
    </>
  );
}
