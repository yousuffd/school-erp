'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { TopBar } from '@/components/layout/TopBar';

const ACADEMICS_TABS = [
  {
    label: 'Subjects',
    href: '/academics/subjects',
    description: 'The curriculum catalog — subjects get scheduled per class in the Timetable tab.',
  },
  {
    label: 'Classes',
    href: '/academics/classes',
    description: 'Formal Grade/Section records — the structure Attendance and Timetable build on.',
  },
  {
    label: 'Timetable',
    href: '/academics/timetable',
    description: "Weekly schedule per class. A teacher can't be double-booked across classes.",
  },
];

/**
 * Shared TopBar + tab bar across the three Academic Management screens.
 * TopBar now lives here (not in each page) specifically so it renders above
 * the tab bar in the page — previously each page rendered its own TopBar as
 * its first element, which put the tabs above the title instead of below it.
 */
export default function AcademicsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = ACADEMICS_TABS.find((tab) => tab.href === pathname) ?? ACADEMICS_TABS[0];

  return (
    <div>
      <TopBar title={activeTab.label} description={activeTab.description} />
      <div className="flex gap-1 border-b border-border bg-card px-6 pt-3">
        {ACADEMICS_TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'rounded-t-button border-b-2 px-4 py-2 text-body font-medium transition-colors',
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
