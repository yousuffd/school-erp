'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { DiaryView } from '@/components/diary/DiaryView';

export default function DiaryPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar title="Diary" description="Daily updates and notes between teachers, students, and parents." />
      <div className="p-6">
        {!user ? <p className="text-body text-text-secondary">Loading…</p> : <DiaryView />}
      </div>
    </>
  );
}
