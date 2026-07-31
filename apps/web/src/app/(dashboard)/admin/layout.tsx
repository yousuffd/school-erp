'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { TopBar } from '@/components/layout/TopBar';

const ADMIN_TABS = [
  {
    label: 'Academic Years',
    href: '/admin/academic-years',
    description: "Configure your school's academic calendar.",
  },
  {
    label: 'Campuses',
    href: '/admin/campuses',
    description: 'Manage the physical campuses under this tenant.',
  },
  {
    label: 'Roles & Permissions',
    href: '/admin/roles',
    description: 'Manage system and custom roles and their permissions across every module.',
  },
  {
    label: 'Feature Toggles',
    href: '/admin/feature-toggles',
    description: 'Turn specific capabilities on or off for your school.',
  },
  {
    label: 'Users',
    href: '/admin/users',
    description: 'Browse everyone with a login across every role and campus.',
  },
];

/**
 * Shared TopBar + tab bar across the three Core Admin screens (kickoff §5).
 * TopBar now lives here (not in each page) so it renders above the tab bar —
 * previously each page rendered its own TopBar as its first element, which
 * put the tabs above the title instead of below it.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = ADMIN_TABS.find((tab) => tab.href === pathname) ?? ADMIN_TABS[0];

  return (
    <div>
      <TopBar title={activeTab.label} description={activeTab.description} />
      <div className="flex gap-1 border-b border-border bg-card px-6 pt-3">
        {ADMIN_TABS.map((tab) => {
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
