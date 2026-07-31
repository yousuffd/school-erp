'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { HealthWellnessView } from '@/components/health-wellness/HealthWellnessView';

export default function HealthWellnessPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Health & Wellness"
        description="Student health profiles, immunizations, clinic visits, medication tracking, and screening campaigns."
      />
      <div className="p-6">
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : (
          <HealthWellnessView tenantId={user.tenantId!} canEdit={isCoreAdminRole(user.role)} />
        )}
      </div>
    </>
  );
}
