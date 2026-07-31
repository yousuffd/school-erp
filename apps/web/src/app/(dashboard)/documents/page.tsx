'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { DocumentsView } from '@/components/documents/DocumentsView';

export default function DocumentsPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Documents"
        description="Student and staff document repository, approvals, and certificate generation."
      />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <DocumentsView />}
      </div>
    </>
  );
}
