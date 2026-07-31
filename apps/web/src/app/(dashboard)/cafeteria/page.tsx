'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { CafeteriaView } from '@/components/cafeteria/CafeteriaView';

export default function CafeteriaPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Cafeteria"
        description="Menus, meal attendance, and student dietary restrictions."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <CafeteriaView tenantId={user.tenantId!} />}
      </div>
    </>
  );
}
