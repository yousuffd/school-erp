'use client';

import { TopBar } from '@/components/layout/TopBar';
import { LmsTabs } from '@/components/lms/LmsTabs';
import { ResourcesView } from '@/components/lms/ResourcesView';

export default function ResourcesPage() {
  return (
    <>
      <TopBar title="Resources" description="Notes and learning materials, organized by subject and class." />
      <div className="p-6">
        <LmsTabs />
        <ResourcesView />
      </div>
    </>
  );
}
