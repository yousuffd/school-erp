'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { RepositorySection } from './RepositorySection';
import { CertificatesSection } from './CertificatesSection';

type Tab = 'repository' | 'certificates';

const TABS: { key: Tab; label: string }[] = [
  { key: 'repository', label: 'Document Repository' },
  { key: 'certificates', label: 'Certificates' },
];

/**
 * Single view with internal section switching — mirrors HealthWellnessView/
 * TransportationView. Unlike most modules, permissions are granular here
 * (Teacher gets create+view but not edit/delete/approve), so each section
 * reads tenantId/user itself via auth.getUser() and applies hasPermission()
 * per-action rather than one flat canEdit prop threaded down.
 */
export function DocumentsView() {
  const [tab, setTab] = useState<Tab>('repository');

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

      {tab === 'repository' && <RepositorySection />}
      {tab === 'certificates' && <CertificatesSection />}
    </div>
  );
}
