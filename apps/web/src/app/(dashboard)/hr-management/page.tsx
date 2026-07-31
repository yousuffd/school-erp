'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { HrManagementView } from '@/components/hr-management/HrManagementView';

export default function HrManagementPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="HR Management"
        description="Recruitment, employee records, leave, attendance, performance, and succession planning."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <HrManagementView tenantId={user.tenantId!} />}
      </div>
    </>
  );
}