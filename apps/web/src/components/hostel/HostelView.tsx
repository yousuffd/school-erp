'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { OverviewSection } from './OverviewSection';
import { RoomsSection } from './RoomsSection';
import { AllocationsSection } from './AllocationsSection';
import { VisitorsSection } from './VisitorsSection';
import { MaintenanceSection } from './MaintenanceSection';
import { AttendanceSection } from './AttendanceSection';
import { PreferencesSection } from './PreferencesSection';

interface Props {
  tenantId: string;
}

type Tab = 'overview' | 'rooms' | 'allocations' | 'visitors' | 'maintenance' | 'attendance' | 'preferences';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'allocations', label: 'Allocations' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'preferences', label: 'Roommate Matching' },
];

/** Same consolidated-view pattern as CafeteriaView — one HostelController on the backend, one view with internal tab state on the frontend. */
export function HostelView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-body font-medium transition-colors',
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewSection tenantId={tenantId} />}
      {tab === 'rooms' && <RoomsSection tenantId={tenantId} />}
      {tab === 'allocations' && <AllocationsSection tenantId={tenantId} />}
      {tab === 'visitors' && <VisitorsSection tenantId={tenantId} />}
      {tab === 'maintenance' && <MaintenanceSection tenantId={tenantId} />}
      {tab === 'attendance' && <AttendanceSection tenantId={tenantId} />}
      {tab === 'preferences' && <PreferencesSection tenantId={tenantId} />}
    </div>
  );
}
