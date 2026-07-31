'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { SalaryStructuresSection } from './SalaryStructuresSection';
import { PayrollRunsSection } from './PayrollRunsSection';
import { LoansSection } from './LoansSection';
import { SettlementsSection } from './SettlementsSection';
import { PayrollSettingsSection } from './PayrollSettingsSection';

interface Props {
  tenantId: string;
}

type Tab = 'salary-structures' | 'runs' | 'loans' | 'settlements' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'salary-structures', label: 'Salary Structures' },
  { key: 'runs', label: 'Payroll Runs' },
  { key: 'loans', label: 'Loans & Advances' },
  { key: 'settlements', label: 'Full & Final Settlements' },
  { key: 'settings', label: 'Settings' },
];

export function PayrollView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('runs');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
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

      {tab === 'salary-structures' && <SalaryStructuresSection tenantId={tenantId} />}
      {tab === 'runs' && <PayrollRunsSection tenantId={tenantId} />}
      {tab === 'loans' && <LoansSection tenantId={tenantId} />}
      {tab === 'settlements' && <SettlementsSection tenantId={tenantId} />}
      {tab === 'settings' && <PayrollSettingsSection tenantId={tenantId} />}
    </div>
  );
}