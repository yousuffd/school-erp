'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  { label: 'Assignments', href: '/assignments' },
  { label: 'Resources', href: '/resources' },
  { label: 'Lectures', href: '/lectures' },
  { label: 'Discussions', href: '/discussions' },
];

export function LmsTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-body font-medium transition-colors',
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
  );
}
