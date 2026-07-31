'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ProfilesSection } from './ProfilesSection';
import { ImmunizationsSection } from './ImmunizationsSection';
import { ClinicVisitsSection } from './ClinicVisitsSection';
import { MedicationsSection } from './MedicationsSection';
import { ScreeningSection } from './ScreeningSection';

interface Props {
  tenantId: string;
  canEdit: boolean;
}

type Tab = 'profiles' | 'immunizations' | 'clinic-visits' | 'medications' | 'screening';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profiles', label: 'Health Profiles' },
  { key: 'immunizations', label: 'Immunizations' },
  { key: 'clinic-visits', label: 'Clinic Visits' },
  { key: 'medications', label: 'Medications' },
  { key: 'screening', label: 'Screening Campaigns' },
];

/**
 * Single view with internal section switching (local state), not separate
 * URL-routed pages — mirrors TransportationView, matching the consolidated
 * HealthWellnessController rather than Library's per-resource split.
 *
 * canEdit gates every Add/Edit affordance across all five sections: Teacher
 * has 'view' only at the permission-decorator level (server-enforced
 * regardless), but hiding write UI for a role that would just get a 403
 * is better UX than showing controls that always fail.
 */
export function HealthWellnessView({ tenantId, canEdit }: Props) {
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
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profiles' && <ProfilesSection tenantId={tenantId} canEdit={canEdit} />}
      {tab === 'immunizations' && <ImmunizationsSection tenantId={tenantId} canEdit={canEdit} />}
      {tab === 'clinic-visits' && <ClinicVisitsSection tenantId={tenantId} canEdit={canEdit} />}
      {tab === 'medications' && <MedicationsSection tenantId={tenantId} canEdit={canEdit} />}
      {tab === 'screening' && <ScreeningSection tenantId={tenantId} canEdit={canEdit} />}
    </div>
  );
}
