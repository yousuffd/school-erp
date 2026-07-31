'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { IncidentsSection } from './IncidentsSection';
import { MyCaseloadSection } from './MyCaseloadSection';

type Tab = 'incidents' | 'caseload';

const TABS: { key: Tab; label: string }[] = [
  { key: 'incidents', label: 'Incidents' },
  { key: 'caseload', label: 'My Caseload' },
];

/**
 * Admin/Counselor-facing only — Student is deliberately excluded from this
 * module entirely (see resolveParentOnlyStudentId's doc comment on the
 * backend), and Parent self-service ("my child's incidents") has no
 * existing portal shell to render into yet, so it's deferred rather than
 * guessed at here. "My Caseload" is visible to anyone with discipline:view
 * — non-Counselor viewers will simply see an empty list, same tolerant
 * pattern as other self-service tabs in this project.
 */
export function DisciplineView() {
  const [tab, setTab] = useState<Tab>('incidents');

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

      {tab === 'incidents' && <IncidentsSection />}
      {tab === 'caseload' && <MyCaseloadSection />}
    </div>
  );
}