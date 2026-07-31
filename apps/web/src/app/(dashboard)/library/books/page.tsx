'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { BooksView } from '@/components/library/BooksView';

export default function LibraryBooksPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar title="Library" description="Manage the book catalog, copies, and stock." />
      <div className="p-6">
        <LibraryTabs />
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <BooksView tenantId={user.tenantId!} />}
      </div>
    </>
  );
}
