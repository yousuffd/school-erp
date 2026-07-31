'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { CounselingReferral, CounselingReferralStatus } from '@/lib/types';

const STATUS_OPTIONS: CounselingReferralStatus[] = ['pending', 'in_progress', 'completed'];

/** Counselor's own referral caseload — GET /discipline/counseling-referrals/my-caseload. */
export function MyCaseloadSection() {
  const [referrals, setReferrals] = useState<CounselingReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .getMyCaseload()
      .then(setReferrals)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load caseload'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleStatusChange(id: string, status: CounselingReferralStatus) {
    setError(null);
    try {
      await api.updateCounselingReferral(id, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update referral');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}
      <Card title="My Counseling Caseload">
        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : referrals.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No referrals assigned to you.</p>
        ) : (
          <ul className="space-y-2">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-card border border-border p-3">
                <div>
                  <p className="text-body text-text-primary">{r.reason}</p>
                  {r.notes && <p className="text-caption text-text-secondary">{r.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={r.status === 'completed' ? 'success' : r.status === 'in_progress' ? 'warning' : 'neutral'}>
                    {r.status}
                  </Badge>
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value as CounselingReferralStatus)}
                    className="rounded-button border border-border px-2 py-1 text-caption"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}