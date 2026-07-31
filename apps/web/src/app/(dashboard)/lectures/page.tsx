'use client';

import { TopBar } from '@/components/layout/TopBar';
import { LmsTabs } from '@/components/lms/LmsTabs';
import { LecturesView } from '@/components/lms/LecturesView';

export default function LecturesPage() {
  return (
    <>
      <TopBar title="Lecture Videos" description="Recorded lectures, organized by subject and class." />
      <div className="p-6">
        <LmsTabs />
        <LecturesView />
      </div>
    </>
  );
}
