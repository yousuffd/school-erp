'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { PayrollView } from '@/components/payroll/PayrollView';

export default function PayrollPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Payroll"
        description="Salary structures, payroll runs, loans & advances, and full & final settlements."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <PayrollView tenantId={user.tenantId!} />}
      </div>
    </>
  );
}