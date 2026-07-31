'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ProfilesSection } from './ProfilesSection';
import { EventsSection } from './EventsSection';
import { DonationsSection } from './DonationsSection';
import { MentorshipSection } from './MentorshipSection';

type Tab = 'profiles' | 'events' | 'donations' | 'mentorship';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profiles', label: 'Alumni Directory' },
  { key: 'events', label: 'Reunions & Events' },
  { key: 'donations', label: 'Donations' },
  { key: 'mentorship', label: 'Mentorship' },
];

/** Admin/officer-only — no self-service, no alumnus login access (explicit decision). */
export function AlumniView() {
  const [tab, setTab] = useState<Tab>('profiles');

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

      {tab === 'profiles' && <ProfilesSection />}
      {tab === 'events' && <EventsSection />}
      {tab === 'donations' && <DonationsSection />}
      {tab === 'mentorship' && <MentorshipSection />}
    </div>
  );
}