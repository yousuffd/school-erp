'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { api, ApiError } from '@/lib/api';
import { Campus } from '@/lib/types';
import { OverviewSection } from './OverviewSection';
import { VehiclesSection } from './VehiclesSection';
import { DriversSection } from './DriversSection';
import { RoutesSection } from './RoutesSection';
import { AssignmentsSection } from './AssignmentsSection';

interface Props {
  tenantId: string;
}

type Tab = 'overview' | 'vehicles' | 'drivers' | 'routes' | 'assignments';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'routes', label: 'Routes & Stops' },
  { key: 'assignments', label: 'Assignments' },
];

/**
 * Single view with internal section switching (local state), not separate
 * URL-routed pages — matches the backend, which is one consolidated
 * TransportationController rather than Library's per-resource controller
 * split. Per explicit choice this session.
 */
export function TransportationView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCampuses(tenantId)
      .then(setCampuses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load campuses'));
  }, [tenantId]);

  const defaultCampusId = campuses[0]?.id ?? '';

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

      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      {tab === 'overview' && <OverviewSection tenantId={tenantId} />}
      {tab === 'vehicles' && <VehiclesSection tenantId={tenantId} campusId={defaultCampusId} />}
      {tab === 'drivers' && <DriversSection tenantId={tenantId} />}
      {tab === 'routes' && <RoutesSection tenantId={tenantId} />}
      {tab === 'assignments' && <AssignmentsSection tenantId={tenantId} />}
    </div>
  );
}
