'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { IssuesView } from '@/components/library/IssuesView';

export default function LibraryIssuesPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar title="Library" description="Issue and return books, track overdue copies and fines." />
      <div className="p-6">
        <LibraryTabs />
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <IssuesView tenantId={user.tenantId!} />}
      </div>
    </>
  );
}
