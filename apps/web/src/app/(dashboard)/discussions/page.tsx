'use client';

import { TopBar } from '@/components/layout/TopBar';
import { LmsTabs } from '@/components/lms/LmsTabs';
import { DiscussionsView } from '@/components/lms/DiscussionsView';

export default function DiscussionsPage() {
  return (
    <>
      <TopBar title="Discussions" description="Ask questions and discuss topics with your class." />
      <div className="p-6">
        <LmsTabs />
        <DiscussionsView />
      </div>
    </>
  );
}
