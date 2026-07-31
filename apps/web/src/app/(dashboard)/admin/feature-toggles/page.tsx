'use client';

import { useEffect, useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { isCoreAdminRole } from '@/lib/roles';
import { FeatureToggle } from '@/lib/types';

/**
 * Day-2 operational config, NOT plan/billing gating (see design discussion).
 * Deliberately shows only feature_keys that are actually wired to a real
 * @RequiresFeature() route on the backend — a toggle appearing here implies
 * it's genuinely enforced, not just cosmetic. Grows as more modules get
 * retrofitted; do not add entries to FEATURE_LABELS until the corresponding
 * backend route has been verified end-to-end (see FeatureToggleGuard).
 */
const FEATURE_LABELS: Record<string, { module: string; label: string; description: string }> = {
  'cafeteria.meal_attendance': {
    module: 'Cafeteria',
    label: 'Meal Attendance',
    description: 'Bulk daily meal headcount tracking.',
  },
  'cafeteria.dietary_restrictions': {
    module: 'Cafeteria',
    label: 'Dietary Restrictions',
    description: 'Per-student allergy and dietary-restriction records.',
  },
  'hostel.room_preferences': {
    module: 'Hostel',
    label: 'Room-Preference Matching',
    description: 'Roommate-compatibility preferences and automated room matching.',
  },
  'hr-management.performance_calibration': {
    module: 'HR Management',
    label: 'Performance Review Calibration',
    description: '360° appraisal cycle calibration workflow.',
  },
  'hr-management.succession_planning': {
    module: 'HR Management',
    label: 'Succession Planning',
    description: 'Succession plans and organizational hierarchy chart.',
  },
};

export default function FeatureTogglesPage() {
  const user = auth.getUser();
  const canManage = isCoreAdminRole(user?.role);
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setLoadFailed(false);
    api
      .getFeatureToggles()
      .then(setToggles)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load toggles');
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleFlip(featureKey: string, current: boolean) {
    setSavingKey(featureKey);
    setError(null);
    try {
      const updated = await api.setFeatureToggle(featureKey, !current);
      setToggles((prev) => {
        const exists = prev.some((t) => t.feature_key === featureKey);
        return exists ? prev.map((t) => (t.feature_key === featureKey ? updated : t)) : [...prev, updated];
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update toggle');
    } finally {
      setSavingKey(null);
    }
  }

  // Known toggles not yet returned by the API (no row exists — treated as
  // enabled by default, same convention as FeatureToggleGuard's own fallback).
  const known = Object.keys(FEATURE_LABELS).map((key) => {
    const existing = toggles.find((t) => t.feature_key === key);
    return existing ?? { id: key, tenant_id: '', feature_key: key, enabled: true, updated_by: null, created_at: '', updated_at: '' };
  });

  const grouped = known.reduce<Record<string, typeof known>>((acc, t) => {
    const moduleName = FEATURE_LABELS[t.feature_key]?.module ?? 'Other';
    acc[moduleName] = acc[moduleName] ?? [];
    acc[moduleName].push(t);
    return acc;
  }, {});

  

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
          {error}
        </div>
      )}

      <Card title="Feature Toggles" >
        <p className="mb-5 text-body text-text-secondary">
          Turn specific capabilities on or off for your school. This does not affect billing or your
          plan — it only controls what shows up in the app day to day.
        </p>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : loadFailed ? (
          <p className="py-6 text-center text-body text-text-secondary">
            Unable to load feature toggle state — see the error above.
          </p>
        ) : (
          Object.entries(grouped).map(([moduleName, rows]) => (
            <div key={moduleName} className="mb-6 last:mb-0">
              <h3 className="mb-2 text-card-title font-semibold text-text-primary">{moduleName}</h3>
              <div className="divide-y divide-border rounded-card border border-border">
                {rows.map((t) => {
                  const meta = FEATURE_LABELS[t.feature_key];
                  return (
                    <div key={t.feature_key} className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2 font-medium text-text-primary">
                          {meta?.label ?? t.feature_key}
                          <Badge tone={t.enabled ? 'success' : 'warning'}>
                            {t.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        {meta?.description && (
                          <p className="mt-0.5 text-caption text-text-secondary">{meta.description}</p>
                        )}
                      </div>
                      {canManage ? (
                        <button
                          type="button"
                          disabled={savingKey === t.feature_key}
                          onClick={() => handleFlip(t.feature_key, t.enabled)}
                          className="flex items-center gap-1.5 text-accent transition-opacity hover:opacity-80 disabled:opacity-40"
                          aria-label={t.enabled ? `Disable ${meta?.label ?? t.feature_key}` : `Enable ${meta?.label ?? t.feature_key}`}
                        >
                          {t.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-text-secondary" />}
                        </button>
                      ) : (
                        <span className="text-caption text-text-secondary">View only</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}