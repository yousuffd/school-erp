'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ActivitiesSection } from './ActivitiesSection';
import { RosterSection } from './RosterSection';
import { EventsSection } from './EventsSection';
import { AwardsSection } from './AwardsSection';

type Tab = 'activities' | 'roster' | 'events' | 'awards';

const TABS: { key: Tab; label: string }[] = [
  { key: 'activities', label: 'Clubs & Teams' },
  { key: 'roster', label: 'Rosters' },
  { key: 'events', label: 'Events & Fixtures' },
  { key: 'awards', label: 'Awards' },
];

/**
 * Single view with internal tab switching — mirrors DocumentsView. Unlike
 * Documents, permissions here follow the simple create/edit/delete pattern
 * (no per-action split needed beyond that), so each section calls
 * hasPermission(user, 'activities', <action>) itself.
 */
export function ActivitiesView() {
  const [tab, setTab] = useState<Tab>('activities');

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-body font-medium transition-colors',
              tab === t.key ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'activities' && <ActivitiesSection />}
      {tab === 'roster' && <RosterSection />}
      {tab === 'events' && <EventsSection />}
      {tab === 'awards' && <AwardsSection />}
    </div>
  );
}