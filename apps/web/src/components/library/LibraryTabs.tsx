'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  { label: 'Overview', href: '/library' },
  { label: 'Catalog', href: '/library/books' },
  { label: 'Issue / Return', href: '/library/issues' },
  { label: 'Reservations', href: '/library/reservations' },
];

export function LibraryTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        // Overview's href ('/library') is a prefix of every other tab's
        // href too, so it needs an exact match — otherwise it would show
        // as active on every library page, not just its own.
        const isActive = tab.href === '/library' ? pathname === '/library' : pathname?.startsWith(tab.href);
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
